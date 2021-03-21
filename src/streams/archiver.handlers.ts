import { NextFunction, Response } from 'express';
import archiver, { Archiver } from 'archiver';
import { ValidationError } from 'yup';
import { Readable, Transform } from 'stream';
import { getLogger } from '../logger';
import { ContentTypes, logErrorsAndFinalize, writeFileHeaders } from '../utils';
import { FileManifest, ResolvedFileManifest } from './_model';
import { ErrorFile, ErrorResponses, MAX_ARCHIVE_SIZE } from '../_constants';
import { SizeHeaderSchema } from '../app/_schema';

const logger = getLogger('archiver.handlers.ts');

enum Steps {
  AWAITING_HEADER,
  AWAITING_FIRST_FILE,
  STREAMING_RESPONSE,
}

interface ExistingFiles {
  [key: string]: number;
}

type State =
  | { step: Steps.AWAITING_HEADER }
  | {
      step: Steps.AWAITING_FIRST_FILE;
      size: number;
      isSingleFileDownload: boolean;
    }
  | { step: Steps.STREAMING_RESPONSE };
/**
 * these actually aren't handlers on an archiver stream itself,
 * rather this factory function is a state machine that maintains an internal archiver object,
 * which responds to events on manifest files paired with their corresponding file streams
 * this sends 200 responses when things go well, and passes errors to middleware when they don't
 * @param res: Response object provided by express
 * @param next: NextFunction, provided by express
 * @param isSingleSelection: whether or not the caller selected a single entity (file or folder)
 * @param archiveName: optional name for the zip in the case the caller selected multiple entities
 * @param determineSingleFileName: how to name the download in the case the result is only one file
 *  NOTE: this differs from isSingleSelection insofar as a user could select a single FOLDER - we don't know how many
 *  files it might have until we begin processing.
 */
export const ArchiverHandlers = (
  res: Response,
  next: NextFunction,
  isSingleSelection: boolean,
  archiveName: string,
  determineSingleFileName: (manifest: FileManifest) => string,
) => {
  let state: State = { step: Steps.AWAITING_HEADER };
  // map of each path in the archive to how many times it has been appended - used to handle name collisions
  let existingFiles: ExistingFiles = {};
  const errorLog: string[] = [];
  const archiver$ = initArchiver(next);

  function data(this: Transform, chunk: ResolvedFileManifest): void {
    try {
      switch (state.step) {
        case Steps.AWAITING_HEADER:
          // eslint-disable-next-line no-case-declarations
          const validated = SizeHeaderSchema.validateSync(chunk);
          state = {
            size: validated.header.size,
            isSingleFileDownload: validated.header.count === 1,
            step: Steps.AWAITING_FIRST_FILE,
          };
          logger.debug('header counts', {
            counts: {
              size: validated.header.size,
              count: validated.header.count,
            },
          });
          break;

        case Steps.AWAITING_FIRST_FILE:
          // inner case 1 - size is too big
          if (state.size >= MAX_ARCHIVE_SIZE) {
            next({
              logger,
              error: ErrorResponses.SIZE_TOO_LARGE,
            });
            state = {
              step: Steps.STREAMING_RESPONSE,
            };
            return;
          }

          // inner case 2 - downloading a single file
          if (state.isSingleFileDownload) {
            if (!isSuccessfulManifest(chunk)) {
              next({
                logger,
                code: 500,
                error: ErrorResponses.UNKNOWN,
              });
              state = {
                step: Steps.STREAMING_RESPONSE,
              };
              return;
            }

            writeFileHeaders({
              res,
              fileName: determineSingleFileName(chunk.manifest),
              extension: '',
              contentType: ContentTypes.OCTET,
            });

            chunk.file$.pipe(res);
            state = {
              step: Steps.STREAMING_RESPONSE,
            };
            return;
          }

          // inner default case - multiple files
          writeFileHeaders({
            res,
            /**
             * @todo Note - Hey there...wondering if there are edge cases here?
             * To date, we should only arrive here with a single package if it is a COLLECTION,
             * in which case there will always be at least one other package underneath, thus the path will not be empty
             */
            fileName: isSingleSelection
              ? chunk.manifest?.path[0]
              : archiveName || undefined,
          });

          archiver$.pipe(res);

          existingFiles = appendFileOrError(
            chunk,
            errorLog,
            archiver$,
            existingFiles,
          );
          state = {
            step: Steps.STREAMING_RESPONSE,
          };
          break;

        case Steps.STREAMING_RESPONSE:
          existingFiles = appendFileOrError(
            chunk,
            errorLog,
            archiver$,
            existingFiles,
          );
          break;

        default:
          throw new Error(ErrorResponses.UNKNOWN);
      }
    } catch (e) {
      if (state.step === Steps.STREAMING_RESPONSE) {
        errorLog.push(`${ErrorFile.OTHER}${e.message}`);
      } else {
        /**
         * @todo: NOTE - why not just pass error as an argument to destroy and
         * collocate more logic in the error event handler below?
         * we can't guarantee the order of the error events being received,
         * so a different error from the json stream arrive before the validation error
         */
        this.destroy();
        next({
          logger,
          error: determineFatalError(e, state.step),
        });
      }
    }
  }

  const end = (): void => {
    logger.debug('manifest stream ended');
    switch (state.step) {
      case Steps.AWAITING_HEADER:
        next({
          logger,
          code: 500,
          error: ErrorResponses.NO_HEADER,
        });
        break;

      case Steps.STREAMING_RESPONSE:
        logErrorsAndFinalize(archiver$, errorLog, logger);
        break;

      default:
        next({
          logger,
          code: 500,
          error: ErrorResponses.DATA_EMPTY,
        });
    }
  };

  const error = (e: Error | null): void => {
    if (e) {
      if (state.step === Steps.STREAMING_RESPONSE) {
        logger.warn('Error occurred after 200 response was sent', {
          error: e.message,
        });
        errorLog.push(`${ErrorFile.FATAL}${e.message}`);
        logErrorsAndFinalize(archiver$, errorLog, logger);
      } else {
        next({
          logger,
          error: determineFatalError(e, state.step),
        });
      }
    }
  };

  return { data, end, error };
};

/**
 * determines whether the input is a valid readable
 */
function isSuccessfulManifest(
  manifest: ResolvedFileManifest,
): manifest is { manifest: FileManifest; file$: Readable } {
  if (manifest.file$ instanceof Error) return false;
  return manifest.file$.readable;
}

/**
 * determines what message to send in the case of a fatal error
 */
function determineFatalError(e: Error, step: Steps): ErrorResponses {
  if (ValidationError.isError(e)) {
    return step === Steps.AWAITING_HEADER
      ? ErrorResponses.HEADER_INVALID
      : ErrorResponses.MANIFEST_INVALID;
  }
  if (e.message === ErrorResponses.NO_HEADER) return e.message;
  if (isJSONError(e)) return ErrorResponses.INVALID_JSON;
  return ErrorResponses.UNKNOWN;
}

/**
 * meh, not great
 * this is what JSONStream says when bad JSON comes through
 */
function isJSONError(e: Error): boolean {
  return e.message.startsWith('Invalid JSON');
}

/**
 * computes the full directory path and file name to send to the archive,
 * deduplicates the file name against the existing files by appending a count e.g. "name (1).txt"
 * returns the full name and an updated map of existing files
 */
function deduplicateFileName(
  manifest: FileManifest,
  existingFiles: ExistingFiles,
): [string, ExistingFiles] {
  const key = fullFileName(manifest);
  const existing = existingFiles[key] ?? 0;
  const updatedExistingFiles = { ...existingFiles, [key]: existing + 1 };

  if (existing) {
    const extensionIdx = manifest.fileName.lastIndexOf('.');
    const fileName = extensionIdx
      ? `${manifest.fileName.substr(
          0,
          extensionIdx,
        )} (${existing})${manifest.fileName.substr(
          extensionIdx,
          manifest.fileName.length,
        )}`
      : `${manifest.fileName} (${existing})`;

    return [fullFileName({ ...manifest, fileName }), updatedExistingFiles];
  }

  return [key, updatedExistingFiles];
}

/**
 * concatenates the path and file name to create the directory/name to send to archiver
 */
function fullFileName(manifest: FileManifest): string {
  const fullName = [...manifest.path, manifest.fileName].join('/');
  logger.silly(`received manifest for ${fullName}`);
  return fullName;
}

/**
 * append a file to the archive, or log an error if that can't be done
 */
function appendFileOrError(
  chunk: ResolvedFileManifest,
  errorLog: string[],
  archiver$: Archiver,
  existingFiles: ExistingFiles,
): ExistingFiles {
  if (chunk.manifest) {
    const [name, updatedExistingFiles] = deduplicateFileName(
      chunk.manifest,
      existingFiles,
    );
    if (isSuccessfulManifest(chunk)) {
      archiver$.append(chunk.file$, { name });
    } else {
      errorLog.push(`${ErrorFile.FILE}${name}`);
    }
    return updatedExistingFiles;
  }
  throw new Error(ErrorResponses.MANIFEST_INVALID);
}

/**
 * configure the archiver object and handle the end/error events
 */
function initArchiver(next: NextFunction): Archiver {
  const archiver$ = archiver('zip', { store: true })
    .on('end', () => {
      logger.debug('archive stream end', { bytes: archiver$.pointer() });
    })
    .on('error', error => {
      next({
        logger,
        error: ErrorResponses.UNKNOWN,
        info: error.message,
      });
    });
  return archiver$;
}

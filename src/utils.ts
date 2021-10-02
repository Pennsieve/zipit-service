import { Archiver } from 'archiver';
import { Logger } from 'winston';
import { Response } from 'express';
import { getLogger } from './logger';
import { ManifestHeader } from './streams/_model';
import { ErrorFile } from './_constants';

const logger = getLogger('utils.ts');

export type Result<ResultType, ErrorType extends Error = Error> =
  | { type: 'error'; error: ErrorType }
  | { type: 'success'; success: ResultType };

/**
 * wraps a function that may throw, giving back a monadic like thing that prevents the caller from having to use a try catch block
 */
export const tryResult = <R, E extends Error = Error>(
  func: () => R,
): Result<R, E> => {
  try {
    const success = func();
    return { type: 'success', success };
  } catch (error) {
    return { type: 'error', error };
  }
};

/**
 * wraps a promise, giving back a monadic like thing that prevents the caller from having to use a try catch block
 */
export const asyncResult = async <R, E extends Error = Error>(
  promise: Promise<R>,
): Promise<Result<R, E>> => {
  try {
    const success = await promise;
    return { type: 'success', success };
  } catch (error) {
    return { type: 'error', error };
  }
};

interface FileHeaderConfig {
  res: Response;
  fileName?: string;
  extension?: string;
  contentType?: string;
}

export enum ContentHeaders {
  DISPOSITION = 'content-disposition',
  TYPE = 'content-type',
}

export enum ContentTypes {
  ZIP = 'application/zip',
  OCTET = 'application/octet-stream',
}

export const ContentDispositionPrefix = 'attachment; filename=';

/**
 * eagerly writes response headers when we are about to stream a file to the client
 */
export const writeFileHeaders = ({
  res,
  fileName = 'pennsieve-data',
  extension = '.zip',
  contentType = ContentTypes.ZIP,
}: FileHeaderConfig): void => {
  if (res.headersSent) {
    logger.info(
      'ready to pipe results, but response headers have already been sent (there was probably an error)',
    );
  } else {
    res.writeHead(200, {
      [ContentHeaders.DISPOSITION]: `${ContentDispositionPrefix}"${encodeURI(fileName)}${extension}"`,
      [ContentHeaders.TYPE]: contentType,
    });
  }
};

/**
 * appends an error file to the log, then attempts to finalize the archive
 */
export function logErrorsAndFinalize(
  archiver$: Archiver,
  errorLog: string[],
  sourceLogger: Logger,
): void {
  try {
    if (errorLog.length > 0) {
      archiver$.append(errorLog.join('\n'), { name: ErrorFile.NAME });
    }
    archiver$.finalize();
  } catch (err) {
    sourceLogger.warn(ErrorFile.SAVE, {
      error: err.message,
    });
  }
}

/**
 * determines that an anonymous stream chunk is a size header instead of data
 * @param chunk
 */
export function isManifestHeader(chunk: any): chunk is ManifestHeader {
  return (
    typeof chunk === 'object' &&
    Object.keys(chunk).length === 1 &&
    chunk.header !== undefined
  );
}

const defaultEventsToLog = [
  'error',
  'warn',
  'close',
  'drain',
  'pipe',
  'unpipe',
  'data',
  'end',
  'pause',
  'resume',
  'readable',
  'header',
  'footer',
  'entry',
];

/**
 * util supporting paranoia
 * log events from a stream
 */
export const logStreamEvents = (
  stream$: NodeJS.ReadWriteStream,
  streamName: string,
  events = defaultEventsToLog,
  level = 'silly',
): NodeJS.ReadWriteStream => {
  events.forEach(event => {
    stream$.on(event, () => {
      logger.log(level, 'stream event', { event, stream: streamName });
    });
  });
  return stream$;
};

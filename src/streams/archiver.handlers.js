"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArchiverHandlers = void 0;
const archiver_1 = __importDefault(require("archiver"));
const yup_1 = require("yup");
const logger_1 = require("../logger");
const utils_1 = require("../utils");
const _constants_1 = require("../_constants");
const _schema_1 = require("../app/_schema");
const logger = logger_1.getLogger('archiver.handlers.ts');
var Steps;
(function (Steps) {
    Steps[Steps["AWAITING_HEADER"] = 0] = "AWAITING_HEADER";
    Steps[Steps["AWAITING_FIRST_FILE"] = 1] = "AWAITING_FIRST_FILE";
    Steps[Steps["STREAMING_RESPONSE"] = 2] = "STREAMING_RESPONSE";
})(Steps || (Steps = {}));
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
exports.ArchiverHandlers = (res, next, isSingleSelection, archiveName, determineSingleFileName) => {
    let state = { step: Steps.AWAITING_HEADER };
    // map of each path in the archive to how many times it has been appended - used to handle name collisions
    let existingFiles = {};
    const errorLog = [];
    const archiver$ = initArchiver(next);
    function data(chunk) {
        var _a;
        try {
            switch (state.step) {
                case Steps.AWAITING_HEADER:
                    // eslint-disable-next-line no-case-declarations
                    const validated = _schema_1.SizeHeaderSchema.validateSync(chunk);
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
                    if (state.size >= _constants_1.MAX_ARCHIVE_SIZE) {
                        next({
                            logger,
                            error: _constants_1.ErrorResponses.SIZE_TOO_LARGE,
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
                                error: _constants_1.ErrorResponses.UNKNOWN,
                            });
                            state = {
                                step: Steps.STREAMING_RESPONSE,
                            };
                            return;
                        }
                        utils_1.writeFileHeaders({
                            res,
                            fileName: determineSingleFileName(chunk.manifest),
                            extension: '',
                            contentType: utils_1.ContentTypes.OCTET,
                        });
                        chunk.file$.pipe(res);
                        state = {
                            step: Steps.STREAMING_RESPONSE,
                        };
                        return;
                    }
                    // inner default case - multiple files
                    utils_1.writeFileHeaders({
                        res,
                        /**
                         * @todo Note - Hey there...wondering if there are edge cases here?
                         * To date, we should only arrive here with a single package if it is a COLLECTION,
                         * in which case there will always be at least one other package underneath, thus the path will not be empty
                         */
                        fileName: isSingleSelection
                            ? (_a = chunk.manifest) === null || _a === void 0 ? void 0 : _a.path[0] : archiveName || undefined,
                    });
                    archiver$.pipe(res);
                    existingFiles = appendFileOrError(chunk, errorLog, archiver$, existingFiles);
                    state = {
                        step: Steps.STREAMING_RESPONSE,
                    };
                    break;
                case Steps.STREAMING_RESPONSE:
                    existingFiles = appendFileOrError(chunk, errorLog, archiver$, existingFiles);
                    break;
                default:
                    throw new Error(_constants_1.ErrorResponses.UNKNOWN);
            }
        }
        catch (e) {
            if (state.step === Steps.STREAMING_RESPONSE) {
                errorLog.push(`${_constants_1.ErrorFile.OTHER}${e.message}`);
            }
            else {
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
    const end = () => {
        logger.debug('manifest stream ended');
        switch (state.step) {
            case Steps.AWAITING_HEADER:
                next({
                    logger,
                    code: 500,
                    error: _constants_1.ErrorResponses.NO_HEADER,
                });
                break;
            case Steps.STREAMING_RESPONSE:
                utils_1.logErrorsAndFinalize(archiver$, errorLog, logger);
                break;
            default:
                next({
                    logger,
                    code: 500,
                    error: _constants_1.ErrorResponses.DATA_EMPTY,
                });
        }
    };
    const error = (e) => {
        if (e) {
            if (state.step === Steps.STREAMING_RESPONSE) {
                logger.warn('Error occurred after 200 response was sent', {
                    error: e.message,
                });
                errorLog.push(`${_constants_1.ErrorFile.FATAL}${e.message}`);
                utils_1.logErrorsAndFinalize(archiver$, errorLog, logger);
            }
            else {
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
function isSuccessfulManifest(manifest) {
    if (manifest.file$ instanceof Error)
        return false;
    return manifest.file$.readable;
}
/**
 * determines what message to send in the case of a fatal error
 */
function determineFatalError(e, step) {
    if (yup_1.ValidationError.isError(e)) {
        return step === Steps.AWAITING_HEADER
            ? _constants_1.ErrorResponses.HEADER_INVALID
            : _constants_1.ErrorResponses.MANIFEST_INVALID;
    }
    if (e.message === _constants_1.ErrorResponses.NO_HEADER)
        return e.message;
    if (isJSONError(e))
        return _constants_1.ErrorResponses.INVALID_JSON;
    return _constants_1.ErrorResponses.UNKNOWN;
}
/**
 * meh, not great
 * this is what JSONStream says when bad JSON comes through
 */
function isJSONError(e) {
    return e.message.startsWith('Invalid JSON');
}
/**
 * computes the full directory path and file name to send to the archive,
 * deduplicates the file name against the existing files by appending a count e.g. "name (1).txt"
 * returns the full name and an updated map of existing files
 */
function deduplicateFileName(manifest, existingFiles) {
    var _a;
    const key = fullFileName(manifest);
    const existing = (_a = existingFiles[key]) !== null && _a !== void 0 ? _a : 0;
    const updatedExistingFiles = { ...existingFiles, [key]: existing + 1 };
    if (existing) {
        const extensionIdx = manifest.fileName.lastIndexOf('.');
        const fileName = extensionIdx
            ? `${manifest.fileName.substr(0, extensionIdx)} (${existing})${manifest.fileName.substr(extensionIdx, manifest.fileName.length)}`
            : `${manifest.fileName} (${existing})`;
        return [fullFileName({ ...manifest, fileName }), updatedExistingFiles];
    }
    return [key, updatedExistingFiles];
}
/**
 * concatenates the path and file name to create the directory/name to send to archiver
 */
function fullFileName(manifest) {
    const fullName = [...manifest.path, manifest.fileName].join('/');
    logger.silly(`received manifest for ${fullName}`);
    return fullName;
}
/**
 * append a file to the archive, or log an error if that can't be done
 */
function appendFileOrError(chunk, errorLog, archiver$, existingFiles) {
    if (chunk.manifest) {
        const [name, updatedExistingFiles] = deduplicateFileName(chunk.manifest, existingFiles);
        if (isSuccessfulManifest(chunk)) {
            archiver$.append(chunk.file$, { name });
        }
        else {
            errorLog.push(`${_constants_1.ErrorFile.FILE}${name}`);
        }
        return updatedExistingFiles;
    }
    throw new Error(_constants_1.ErrorResponses.MANIFEST_INVALID);
}
/**
 * configure the archiver object and handle the end/error events
 */
function initArchiver(next) {
    const archiver$ = archiver_1.default('zip', { store: true })
        .on('end', () => {
        logger.debug('archive stream end', { bytes: archiver$.pointer() });
    })
        .on('error', error => {
        next({
            logger,
            error: _constants_1.ErrorResponses.UNKNOWN,
            info: error.message,
        });
    });
    return archiver$;
}

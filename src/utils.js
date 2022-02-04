"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logStreamEvents = exports.isManifestHeader = exports.logErrorsAndFinalize = exports.writeFileHeaders = exports.ContentDispositionPrefix = exports.ContentTypes = exports.ContentHeaders = exports.asyncResult = exports.tryResult = void 0;
const logger_1 = require("./logger");
const _constants_1 = require("./_constants");
const logger = logger_1.getLogger('utils.ts');
/**
 * wraps a function that may throw, giving back a monadic like thing that prevents the caller from having to use a try catch block
 */
exports.tryResult = (func) => {
    try {
        const success = func();
        return { type: 'success', success };
    }
    catch (error) {
        return { type: 'error', error };
    }
};
/**
 * wraps a promise, giving back a monadic like thing that prevents the caller from having to use a try catch block
 */
exports.asyncResult = async (promise) => {
    try {
        const success = await promise;
        return { type: 'success', success };
    }
    catch (error) {
        return { type: 'error', error };
    }
};
var ContentHeaders;
(function (ContentHeaders) {
    ContentHeaders["DISPOSITION"] = "content-disposition";
    ContentHeaders["TYPE"] = "content-type";
})(ContentHeaders = exports.ContentHeaders || (exports.ContentHeaders = {}));
var ContentTypes;
(function (ContentTypes) {
    ContentTypes["ZIP"] = "application/zip";
    ContentTypes["OCTET"] = "application/octet-stream";
})(ContentTypes = exports.ContentTypes || (exports.ContentTypes = {}));
exports.ContentDispositionPrefix = 'attachment; filename=';
/**
 * eagerly writes response headers when we are about to stream a file to the client
 */
exports.writeFileHeaders = ({ res, fileName = 'pennsieve-data', extension = '.zip', contentType = ContentTypes.ZIP, }) => {
    if (res.headersSent) {
        logger.info('ready to pipe results, but response headers have already been sent (there was probably an error)');
    }
    else {
        res.writeHead(200, {
            [ContentHeaders.DISPOSITION]: `${exports.ContentDispositionPrefix}"${encodeURI(fileName)}${extension}"`,
            [ContentHeaders.TYPE]: contentType,
        });
    }
};
/**
 * appends an error file to the log, then attempts to finalize the archive
 */
function logErrorsAndFinalize(archiver$, errorLog, sourceLogger) {
    try {
        if (errorLog.length > 0) {
            archiver$.append(errorLog.join('\n'), { name: _constants_1.ErrorFile.NAME });
        }
        archiver$.finalize();
    }
    catch (err) {
        sourceLogger.warn(_constants_1.ErrorFile.SAVE, {
            error: err.message,
        });
    }
}
exports.logErrorsAndFinalize = logErrorsAndFinalize;
/**
 * determines that an anonymous stream chunk is a size header instead of data
 * @param chunk
 */
function isManifestHeader(chunk) {
    return (typeof chunk === 'object' &&
        Object.keys(chunk).length === 1 &&
        chunk.header !== undefined);
}
exports.isManifestHeader = isManifestHeader;
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
exports.logStreamEvents = (stream$, streamName, events = defaultEventsToLog, level = 'silly') => {
    events.forEach(event => {
        stream$.on(event, () => {
            logger.log(level, 'stream event', { event, stream: streamName });
        });
    });
    return stream$;
};

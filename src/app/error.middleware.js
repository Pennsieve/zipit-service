"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const _constants_1 = require("../_constants");
const utils_1 = require("../utils");
/**
 * tries to send an error response to the client
 * logs a warning if a response has already been sent
 */
exports.errorMiddleware = ({ error, info = '', logger }, _1, res, _2) => {
    if (res.headersSent) {
        logger.warn('Error occurred after sending response', {
            error,
            info,
        });
    }
    else {
        logger.info(info, { error });
        utils_1.writeFileHeaders({
            res,
            fileName: _constants_1.ErrorFile.NAME,
            contentType: 'text/plain',
            extension: '',
        });
        res.write(JSON.stringify({
            status: determineStatus(error),
            error,
            info,
        }, undefined, 2));
        res.end();
    }
};
function determineStatus(error) {
    switch (error) {
        case _constants_1.ErrorResponses.REQUEST_INVALID:
            return 400;
        case _constants_1.ErrorResponses.SIZE_TOO_LARGE:
            return 422;
        default:
            return 500;
    }
}

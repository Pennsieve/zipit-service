"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogger = void 0;
const winston_1 = require("winston");
const _constants_1 = require("./_constants");
/**
 * returns a winston logger
 * @param fileName should be the same as the source file where this logger is used
 */
exports.getLogger = (fileName) => winston_1.createLogger({
    format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.json()),
    defaultMeta: {
        sourceFile: fileName,
        pennsieve: {
            // eslint-disable-next-line @typescript-eslint/camelcase
            service_name: 'zipit-service',
        },
    },
    exitOnError: false,
    transports: [
        new winston_1.transports.Console({
            level: _constants_1.LOG_LEVEL,
            handleExceptions: true,
            silent: process.env.NODE_ENV === 'test__NO_LOGS',
        }),
    ],
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const app_1 = require("./app/app");
const logger_1 = require("./logger");
const _constants_1 = require("./_constants");
const logger = logger_1.getLogger('index.ts');
http_1.createServer(app_1.app).listen(_constants_1.PORT, () => {
    logger.verbose(`http server online`, {
        constants: {
            PORT: _constants_1.PORT,
            LOG_LEVEL: _constants_1.LOG_LEVEL,
            API_URL: _constants_1.API_URL,
            PACKAGES_PATH: _constants_1.PACKAGES_PATH,
            MANIFEST_PATH: _constants_1.MANIFEST_PATH,
            MAX_ARCHIVE_SIZE: _constants_1.MAX_ARCHIVE_SIZE,
        },
    });
});

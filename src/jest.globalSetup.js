"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const app_1 = require("./app/app");
const _constants_1 = require("./_constants");
const logger_1 = require("./logger");
const testFileServer_1 = require("./test-file-server/testFileServer");
const logger = logger_1.getLogger('jest.globalSetup.ts');
/**
 * stand up the app server and the test file server
 */
// eslint-disable-next-line import/no-default-export
exports.default = async () => {
    await new Promise((resolve, reject) => {
        let appServer;
        let testFileServer;
        try {
            appServer = http_1.createServer(app_1.app).listen(_constants_1.PORT, () => {
                logger.info(`app server listening on port ${_constants_1.PORT}`);
                try {
                    testFileServer = http_1.createServer(testFileServer_1.testApp).listen(_constants_1.TEST_FILE_SERVER_PORT, () => {
                        logger.info(`test file server listening on port ${_constants_1.TEST_FILE_SERVER_PORT}`);
                        global.appServer = appServer;
                        global.testFileServer = testFileServer;
                        resolve();
                    });
                }
                catch (e) {
                    logger.error('could not start test file server', {
                        error: e.message,
                    });
                    reject(e);
                }
            });
        }
        catch (e) {
            logger.error('could not start test app server', { error: e.message });
            reject(e);
        }
    });
};

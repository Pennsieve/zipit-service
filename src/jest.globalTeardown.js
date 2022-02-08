"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./logger");
const logger = logger_1.getLogger('jest.globalTeardown.ts');
/**
 * tear down the app server and the test file server
 */
// eslint-disable-next-line import/no-default-export
exports.default = async () => {
    await new Promise((resolve, reject) => {
        global.appServer.close((e) => {
            if (!e) {
                logger.info('successfully closed app server');
                global.testFileServer.close((e2) => {
                    if (!e2) {
                        logger.info('successfully closed test file server');
                        resolve();
                    }
                    else {
                        logger.error('could not close test file server', {
                            error: e2.message,
                        });
                        reject(e2);
                    }
                });
            }
            else {
                logger.error('could not close app server', { error: e.message });
                reject(e);
            }
        });
    });
};

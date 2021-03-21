import { createServer, Server } from 'http';
import { app } from './app/app';
import { PORT, TEST_FILE_SERVER_PORT } from './_constants';
import { getLogger } from './logger';
import { testApp } from './test-file-server/testFileServer';

const logger = getLogger('jest.globalSetup.ts');

/**
 * stand up the app server and the test file server
 */
// eslint-disable-next-line import/no-default-export
export default async (): Promise<void> => {
  await new Promise((resolve, reject) => {
    let appServer: Server;
    let testFileServer: Server;
    try {
      appServer = createServer(app).listen(PORT, () => {
        logger.info(`app server listening on port ${PORT}`);
        try {
          testFileServer = createServer(testApp).listen(
            TEST_FILE_SERVER_PORT,
            () => {
              logger.info(
                `test file server listening on port ${TEST_FILE_SERVER_PORT}`,
              );
              (global as any).appServer = appServer;
              (global as any).testFileServer = testFileServer;
              resolve();
            },
          );
        } catch (e) {
          logger.error('could not start test file server', {
            error: e.message,
          });
          reject(e);
        }
      });
    } catch (e) {
      logger.error('could not start test app server', { error: e.message });
      reject(e);
    }
  });
};

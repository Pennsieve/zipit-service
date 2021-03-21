import { getLogger } from './logger';

const logger = getLogger('jest.globalTeardown.ts');

/**
 * tear down the app server and the test file server
 */
// eslint-disable-next-line import/no-default-export
export default async (): Promise<void> => {
  await new Promise((resolve, reject) => {
    (global as any).appServer.close((e: Error) => {
      if (!e) {
        logger.info('successfully closed app server');
        (global as any).testFileServer.close((e2: Error) => {
          if (!e2) {
            logger.info('successfully closed test file server');
            resolve();
          } else {
            logger.error('could not close test file server', {
              error: e2.message,
            });
            reject(e2);
          }
        });
      } else {
        logger.error('could not close app server', { error: e.message });
        reject(e);
      }
    });
  });
};

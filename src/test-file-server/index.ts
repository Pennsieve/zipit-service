import { createServer } from 'http';
import { testApp } from './testFileServer';
import { getLogger } from '../logger';

const logger = getLogger('test-file-server/index.ts');

createServer(testApp).listen(4001, () =>
  logger.info('test server listening on port 4001'),
);

import { createServer } from 'http';
import { app } from './app/app';
import { getLogger } from './logger';
import {
  API_URL,
  LOG_LEVEL,
  MANIFEST_PATH,
  MAX_ARCHIVE_SIZE,
  PACKAGES_PATH,
  PORT,
} from './_constants';

const logger = getLogger('index.ts');

createServer(app).listen(PORT, () => {
  logger.verbose(`http server online`, {
    constants: {
      PORT,
      LOG_LEVEL,
      API_URL,
      PACKAGES_PATH,
      MANIFEST_PATH,
      MAX_ARCHIVE_SIZE,
    },
  });
});

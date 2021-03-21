import { createLogger, format, Logger, transports } from 'winston';
import { LOG_LEVEL } from './_constants';

/**
 * returns a winston logger
 * @param fileName should be the same as the source file where this logger is used
 */
export const getLogger = (fileName: string): Logger =>
  createLogger({
    format: format.combine(format.timestamp(), format.json()),
    defaultMeta: {
      sourceFile: fileName,
      pennsieve: {
        // eslint-disable-next-line @typescript-eslint/camelcase
        service_name: 'zipit-service',
      },
    },
    exitOnError: false,
    transports: [
      new transports.Console({
        level: LOG_LEVEL,
        handleExceptions: true,
        silent: process.env.NODE_ENV === 'test__NO_LOGS',
      }),
    ],
  });

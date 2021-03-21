import { NextFunction, Request, Response } from 'express';
import { Logger } from 'winston';
import { ErrorFile, ErrorResponses } from '../_constants';
import { writeFileHeaders } from '../utils';

export interface ProtocolError {
  error: ErrorResponses;
  info?: string;
  logger: Logger;
}

/**
 * tries to send an error response to the client
 * logs a warning if a response has already been sent
 */
export const errorMiddleware = (
  { error, info = '', logger }: ProtocolError,
  _1: Request,
  res: Response,
  _2: NextFunction,
): void => {
  if (res.headersSent) {
    logger.warn('Error occurred after sending response', {
      error,
      info,
    });
  } else {
    logger.info(info, { error });
    writeFileHeaders({
      res,
      fileName: ErrorFile.NAME,
      contentType: 'text/plain',
      extension: '',
    });
    res.write(
      JSON.stringify(
        {
          status: determineStatus(error),
          error,
          info,
        },
        undefined,
        2,
      ),
    );
    res.end();
  }
};

function determineStatus(error: ErrorResponses): number {
  switch (error) {
    case ErrorResponses.REQUEST_INVALID:
      return 400;
    case ErrorResponses.SIZE_TOO_LARGE:
      return 422;
    default:
      return 500;
  }
}

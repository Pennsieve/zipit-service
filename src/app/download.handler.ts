import { RequestHandler } from 'express';
import axios from 'axios';
import { parse } from 'JSONStream';
import { EventEmitter } from 'events';
import { pipeline } from 'stream';
import { ValidationError } from 'yup';
import { ArchiverHandlers } from '../streams/archiver.handlers';
import { ManifestTransform } from '../streams/manifest.transform';
import { getLogger } from '../logger';
import { ErrorResponses } from '../_constants';
import { ValidateRequestAndGetHandlerConfig } from './validators';

const logger = getLogger('packages.handler.ts');

/**
 * handles requests to zip up an array of packages
 */
export const downloadHandler: (
  validator: ValidateRequestAndGetHandlerConfig,
) => RequestHandler = validator => async (req, res, next) => {
  try {
    const {
      manifestUrl,
      manifestBody,
      isSingleSelection,
      archiveName,
      determineSingleFileName,
    } = validator(req);

    const manifestSource = await axios.post<NodeJS.ReadableStream>(
      manifestUrl,
      manifestBody,
      { responseType: 'stream' },
    );

    const manifestParser$ = parse('data.*')
      // forward the header as the first data event
      // eslint-disable-next-line func-names
      .once('header', function(this: EventEmitter, chunk: unknown) {
        this.emit('data', chunk);
      });

    const { data, error, end } = ArchiverHandlers(
      res,
      next,
      isSingleSelection,
      archiveName,
      determineSingleFileName,
    );

    pipeline(
      manifestSource.data,
      manifestParser$,
      new ManifestTransform(),
      error,
    )
      .on('data', data)
      .on('end', end);
  } catch (e) {
    next({
      logger,
      error: ValidationError.isError(e)
        ? ErrorResponses.REQUEST_INVALID
        : ErrorResponses.UNKNOWN,
      info: ValidationError.isError(e) ? e.errors.join(',\n') : e.message,
    });
  }
};

import { Readable, Transform, TransformCallback } from 'stream';
import axios from 'axios';
import { ValidationError } from 'yup';
import { getLogger } from '../logger';
import { asyncResult, isManifestHeader, tryResult } from '../utils';
import { FileManifest } from './_model';
import { ManifestSchema } from './_schema';

const logger = getLogger('manifest.transform.ts');

/**
 * Enriches the manifest entries with the corresponding file stream.
 * Does NOT emit an error if the file cannot be found, since that would cause the streams to unpipe.
 * Error handling should be done by the consuming stream that knows what to do if a file isn't found.
 *
 * Under normal stream processing, we would happily open multiple requests to S3 at the same time.
 * In these circumstances, large files can cause other downloads to be starved.
 *
 * For example, we open a connection for a very large file and begin downloading.
 * At the same time we open N other connections.  Since the first file consumes all of the network bandwidth,
 * the other requests never consume the data from S3, and eventually S3 times them out.
 *
 * To combat this scenario, a backpressure mechanism enforces that only 1 request is open at a time.
 */
export class ManifestTransform extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  counts = {
    expected: 0,
    received: 0,
    inProgress: 0,
    error: 0,
    complete: 0,
  };

  /**
   * we trigger node's backpressure mechanism by NOT calling the TransformCallback
   * if there is already a request in process.  Rather, we stick the callback and the payload here.
   */
  backpressureQueue = [] as {
    callback: TransformCallback;
    manifest: FileManifest;
  }[];

  // eslint-disable-next-line no-underscore-dangle
  _transform(chunk: any, _: string, callback: TransformCallback): void {
    if (isManifestHeader(chunk)) {
      this.counts.expected = chunk.header.count;
      callback(null, chunk);
      return;
    }

    const { counts, backpressureQueue } = this;
    counts.received += 1;
    this.logCounts('received manifest');

    const validationResult = tryResult<FileManifest, Error | ValidationError>(
      () => ManifestSchema.validateSync(chunk),
    );

    if (validationResult.type === 'error') {
      counts.error += 1;
      logger.warn('received incorrect JSON for manifest', {
        error: ValidationError.isError(validationResult.error)
          ? validationResult.error.errors.join(', ')
          : validationResult.error.message,
      });

      // I can stilll hear you saying, you would never - break - the chain
      callback(null, {
        manifest: undefined,
        file$: validationResult.error,
      });
      return;
    }

    const manifest = validationResult.success;

    /**
     * the mechanism to inform the upstream that we are not ready for more chunks
     * is to NOT call the TransformCallback.
     * add the callback, as well as the manifest, so we can use them once we are ready to continue
     */
    if (counts.inProgress > 0) {
      backpressureQueue.push({ callback, manifest });
      return;
    }

    this.fetchFile(callback, manifest);
  }

  /**
   * attempts to fetch a file from S3
   * Updating state and handling success/error accordingly
   */
  async fetchFile(
    callback: TransformCallback,
    manifest: FileManifest,
  ): Promise<void> {
    this.counts.inProgress += 1;
    this.logCounts('start fetch');

    const fetchResult = await asyncResult(
      axios.get<Readable>(manifest.url, {
        responseType: 'stream',
      }),
    );

    if (fetchResult.type === 'error') {
      this.handleFetchError(callback, manifest, fetchResult.error);
    } else {
      this.handleFetchSuccess(callback, manifest, fetchResult.success.data);
    }
  }

  /**
   * calls the TransformCallback and registers a listener
   * to invoke more downloading once this file download completes
   */
  handleFetchSuccess(
    callback: TransformCallback,
    manifest: FileManifest,
    fileStream: Readable,
  ): void {
    callback(null, {
      manifest,
      file$: fileStream,
    });
    fileStream.on('close', () => {
      /**
       * @todo NOTE - the next file CANNOT proceed unless this callback is invoked.
       * if some kind of error occurs such that the 'close' event is never emitted,
       * the whole process would hypothetically hang because it would never start downloading a queued file
       */
      this.fetchQueuedFile();
    });
  }

  /**
   * invoked once some previous file is completed,
   * this function checks the queue and the inProgress state,
   * and triggers another download accordingly
   */
  async fetchQueuedFile(): Promise<void> {
    this.counts.inProgress -= 1;
    this.counts.complete += 1;
    this.logCounts('after download');

    if (this.counts.inProgress > 0) return;

    const head = this.backpressureQueue.pop();
    if (!head) return;

    const { callback, manifest } = head;
    this.fetchFile(callback, manifest);
  }

  handleFetchError(
    callback: TransformCallback,
    manifest: FileManifest,
    error: Error,
  ): void {
    this.counts.error += 1;
    this.counts.inProgress -= 1;
    logger.info(`error fetching ${manifest.url}`, {
      error: error.message,
    });
    callback(null, { manifest, file$: error });
  }

  logCounts(marker: string): void {
    logger.silly(`download status: ${marker}`, {
      counts: {
        ...this.counts,
        queue: this.backpressureQueue.length,
      },
    });
  }
}

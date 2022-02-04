"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManifestTransform = void 0;
const stream_1 = require("stream");
const axios_1 = __importDefault(require("axios"));
const yup_1 = require("yup");
const logger_1 = require("../logger");
const utils_1 = require("../utils");
const _schema_1 = require("./_schema");
const logger = logger_1.getLogger('manifest.transform.ts');
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
class ManifestTransform extends stream_1.Transform {
    constructor() {
        super({ objectMode: true });
        this.counts = {
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
        this.backpressureQueue = [];
    }
    // eslint-disable-next-line no-underscore-dangle
    _transform(chunk, _, callback) {
        if (utils_1.isManifestHeader(chunk)) {
            this.counts.expected = chunk.header.count;
            callback(null, chunk);
            return;
        }
        const { counts, backpressureQueue } = this;
        counts.received += 1;
        this.logCounts('received manifest');
        const validationResult = utils_1.tryResult(() => _schema_1.ManifestSchema.validateSync(chunk));
        if (validationResult.type === 'error') {
            counts.error += 1;
            logger.warn('received incorrect JSON for manifest', {
                error: yup_1.ValidationError.isError(validationResult.error)
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
    async fetchFile(callback, manifest) {
        this.counts.inProgress += 1;
        this.logCounts('start fetch');
        const fetchResult = await utils_1.asyncResult(axios_1.default.get(manifest.url, {
            responseType: 'stream',
        }));
        if (fetchResult.type === 'error') {
            this.handleFetchError(callback, manifest, fetchResult.error);
        }
        else {
            this.handleFetchSuccess(callback, manifest, fetchResult.success.data);
        }
    }
    /**
     * calls the TransformCallback and registers a listener
     * to invoke more downloading once this file download completes
     */
    handleFetchSuccess(callback, manifest, fileStream) {
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
    async fetchQueuedFile() {
        this.counts.inProgress -= 1;
        this.counts.complete += 1;
        this.logCounts('after download');
        if (this.counts.inProgress > 0)
            return;
        const head = this.backpressureQueue.pop();
        if (!head)
            return;
        const { callback, manifest } = head;
        this.fetchFile(callback, manifest);
    }
    handleFetchError(callback, manifest, error) {
        this.counts.error += 1;
        this.counts.inProgress -= 1;
        logger.info(`error fetching ${manifest.url}`, {
            error: error.message,
        });
        callback(null, { manifest, file$: error });
    }
    logCounts(marker) {
        logger.silly(`download status: ${marker}`, {
            counts: {
                ...this.counts,
                queue: this.backpressureQueue.length,
            },
        });
    }
}
exports.ManifestTransform = ManifestTransform;

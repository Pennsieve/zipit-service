"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadHandler = void 0;
const axios_1 = __importDefault(require("axios"));
const JSONStream_1 = require("JSONStream");
const stream_1 = require("stream");
const yup_1 = require("yup");
const archiver_handlers_1 = require("../streams/archiver.handlers");
const manifest_transform_1 = require("../streams/manifest.transform");
const logger_1 = require("../logger");
const _constants_1 = require("../_constants");
const logger = logger_1.getLogger('packages.handler.ts');
/**
 * handles requests to zip up an array of packages
 */
exports.downloadHandler = validator => async (req, res, next) => {
    try {
        const { manifestUrl, manifestBody, isSingleSelection, archiveName, determineSingleFileName, } = validator(req);
        const manifestSource = await axios_1.default.post(manifestUrl, manifestBody, { responseType: 'stream' });
        const manifestParser$ = JSONStream_1.parse('data.*')
            // forward the header as the first data event
            // eslint-disable-next-line func-names
            .once('header', function (chunk) {
            this.emit('data', chunk);
        });
        const { data, error, end } = archiver_handlers_1.ArchiverHandlers(res, next, isSingleSelection, archiveName, determineSingleFileName);
        stream_1.pipeline(manifestSource.data, manifestParser$, new manifest_transform_1.ManifestTransform(), error)
            .on('data', data)
            .on('end', end);
    }
    catch (e) {
        next({
            logger,
            error: yup_1.ValidationError.isError(e)
                ? _constants_1.ErrorResponses.REQUEST_INVALID
                : _constants_1.ErrorResponses.UNKNOWN,
            info: yup_1.ValidationError.isError(e) ? e.errors.join(',\n') : e.message,
        });
    }
};

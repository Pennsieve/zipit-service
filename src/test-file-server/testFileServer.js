"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testApp = exports.TEST_PACKAGE_ID = void 0;
/**
 * this file exports an http server that will respond to requests for files in this directory
 * it allows me to write integration tests that mimic responses from the API
 */
const express_1 = __importDefault(require("express"));
const fs_1 = require("fs");
const path_1 = require("path");
const stream_1 = require("stream");
const yup_1 = require("yup");
const logger_1 = require("../logger");
exports.TEST_PACKAGE_ID = 'testPackage';
const logger = logger_1.getLogger('testFileServer.ts');
/**
 * mimics the download-manifest endpoint in pennsieve-api
 */
const stubManifestApi = async (req, res) => {
    try {
        const { nodeIds } = yup_1.object()
            .shape({
            nodeIds: yup_1.array()
                .of(yup_1.string())
                .min(1)
                .required(),
        })
            .validateSync(req.body);
        const file = nodeIds[0];
        logger.silly(`attempting to produce read stream for file ${file}`);
        const readStream = fs_1.createReadStream(path_1.join(__dirname, 'manifests', file));
        logger.silly(`created read stream for file ${file}`);
        return stream_1.pipeline(readStream, res, e => {
            var _a;
            if (e) {
                logger.debug((_a = e === null || e === void 0 ? void 0 : e.message) !== null && _a !== void 0 ? _a : '');
                if (!res.headersSent) {
                    res.status(500).send(JSON.stringify(e === null || e === void 0 ? void 0 : e.stack));
                }
            }
        });
    }
    catch (e) {
        logger.debug(e.message);
        return res.status(500).send(JSON.stringify(e.stack));
    }
};
/**
 * mimics the package file endpoint in pennsieve-api
 */
const stubFileApi = async (req, res) => {
    try {
        const { params: { name }, } = yup_1.object()
            .shape({
            params: yup_1.object().shape({
                name: yup_1.string().required(),
            }),
        })
            .validateSync(req);
        return res.json({
            url: `${process.env.API_URL}/file/${name}`,
        });
    }
    catch (e) {
        logger.debug(e.message);
        return res.status(500).send(JSON.stringify(e.stack));
    }
};
/**
 * provides test files
 */
const testFileHandler = async (req, res) => {
    try {
        const { params: { name }, } = yup_1.object()
            .shape({
            params: yup_1.object().shape({
                name: yup_1.string().required(),
            }),
        })
            .validateSync(req);
        const readStream = fs_1.createReadStream(path_1.join(__dirname, 'files', name));
        logger.silly(`created read stream for file ${name}`);
        return stream_1.pipeline(readStream, res, e => {
            var _a;
            if (e) {
                logger.debug((_a = e === null || e === void 0 ? void 0 : e.message) !== null && _a !== void 0 ? _a : '');
                if (!res.headersSent) {
                    res.status(500).send(JSON.stringify(e === null || e === void 0 ? void 0 : e.stack));
                }
            }
        });
    }
    catch (e) {
        logger.debug(e.message);
        return res.status(500).send(JSON.stringify(e.stack));
    }
};
exports.testApp = express_1.default();
exports.testApp.use(express_1.default.json());
exports.testApp.get('/health', (_, response) => response.status(204).send());
exports.testApp.post('/manifest', stubManifestApi);
exports.testApp.get(`/${exports.TEST_PACKAGE_ID}/files/:name`, stubFileApi);
exports.testApp.get('/file/:name', testFileHandler);

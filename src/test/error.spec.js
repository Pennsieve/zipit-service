"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const _constants_1 = require("./_constants");
const utils_1 = require("./utils");
const _constants_2 = require("../_constants");
describe('bad request', () => {
    describe('platform endpoint', () => {
        describe('api_key query param', () => {
            it('is required', async () => {
                const res = await axios_1.default.post(_constants_1.APP_URL, {
                    data: {
                        nodeIds: ['manifest.json'],
                    },
                });
                expect(res.status).toEqual(200);
                expect(res.data).toEqual({
                    status: 400,
                    error: 'the request was invalid',
                    info: 'query.api_key is a required field',
                });
            });
        });
        describe('nodeIds body param', () => {
            it('is required', async () => {
                const res = await axios_1.default.post(_constants_1.APP_URL_WITH_API_KEY);
                expect(res.status).toEqual(200);
                expect(res.data).toEqual({
                    status: 400,
                    error: 'the request was invalid',
                    info: 'body.data.nodeIds is a required field',
                });
            });
            it('must be an array', async () => {
                const res = await axios_1.default.post(_constants_1.APP_URL_WITH_API_KEY, {
                    data: {
                        nodeIds: 'foo',
                    },
                });
                expect(res.status).toEqual(200);
                expect(res.data.status).toEqual(400);
            });
            it('must have at least one item', async () => {
                const res = await axios_1.default.post(_constants_1.APP_URL_WITH_API_KEY, {
                    data: {
                        nodeIds: [],
                    },
                });
                expect(res.status).toEqual(200);
                expect(res.data).toEqual({
                    status: 400,
                    error: 'the request was invalid',
                    info: 'body.data.nodeIds field must have at least 1 items,\nbody.data.nodeIds is a required field',
                });
            });
        });
        describe('fileIds body param', () => {
            it('if provided, must be numeric', async () => {
                const res = await axios_1.default.post(_constants_1.APP_URL_WITH_API_KEY, {
                    data: {
                        nodeIds: ['foo'],
                        fileIds: ['foo'],
                    },
                });
                expect(res.status).toEqual(200);
                expect(res.data).toEqual({
                    status: 400,
                    error: 'the request was invalid',
                    info: `body.data.fileIds[0] must be a \`number\` type, but the final value was: \`NaN\` (cast from the value \`"foo"\`).`,
                });
            });
            it('if provided, must have at least one item', async () => {
                const res = await axios_1.default.post(_constants_1.APP_URL_WITH_API_KEY, {
                    data: {
                        nodeIds: ['foo'],
                        fileIds: [],
                    },
                });
                expect(res.status).toEqual(200);
                expect(res.data).toEqual({
                    status: 400,
                    error: 'the request was invalid',
                    info: 'body.data.fileIds field must have at least 1 items',
                });
            });
        });
        describe('archiveName body param', () => {
            it('is only valid if more than one node is selected', async () => {
                const res = await axios_1.default.post(_constants_1.APP_URL_WITH_API_KEY, {
                    data: {
                        nodeIds: ['foo'],
                        fileIds: [1],
                        archiveName: 'test',
                    },
                });
                expect(res.status).toEqual(200);
                expect(res.data).toEqual({
                    status: 400,
                    error: 'the request was invalid',
                    info: 'body.data.archiveName can only be specified when multiple nodeIds are specified',
                });
            });
        });
    });
    describe('discover endpoint', () => {
        describe('datasetId body param', () => {
            it('is required', async () => {
                const res = await axios_1.default.post(`${_constants_1.APP_URL}/discover`, {
                    data: {
                        paths: ['foo'],
                        version: 1,
                    },
                });
                expect(res.status).toEqual(200);
                expect(res.data).toEqual({
                    status: 400,
                    error: 'the request was invalid',
                    info: 'body.data.datasetId is a required field',
                });
            });
            it('must be numeric', async () => {
                const res = await axios_1.default.post(`${_constants_1.APP_URL}/discover`, {
                    data: {
                        paths: ['foo'],
                        version: 1,
                        datasetId: 'foo',
                    },
                });
                expect(res.status).toEqual(200);
                expect(res.data).toEqual({
                    status: 400,
                    error: 'the request was invalid',
                    info: `body.data.datasetId must be a \`number\` type, but the final value was: \`NaN\` (cast from the value \`"foo"\`).`,
                });
            });
        });
        describe('version body param', () => {
            it('is required', async () => {
                const res = await axios_1.default.post(`${_constants_1.APP_URL}/discover`, {
                    data: {
                        paths: ['foo'],
                        datasetId: 1,
                    },
                });
                expect(res.status).toEqual(200);
                expect(res.data).toEqual({
                    status: 400,
                    error: 'the request was invalid',
                    info: 'body.data.version is a required field',
                });
            });
            it('must be numeric', async () => {
                const res = await axios_1.default.post(`${_constants_1.APP_URL}/discover`, {
                    data: {
                        paths: ['foo'],
                        version: 'foo',
                        datasetId: 1,
                    },
                });
                expect(res.status).toEqual(200);
                expect(res.data).toEqual({
                    status: 400,
                    error: 'the request was invalid',
                    info: `body.data.version must be a \`number\` type, but the final value was: \`NaN\` (cast from the value \`"foo"\`).`,
                });
            });
        });
        describe('paths body param', () => {
            it('is required', async () => {
                const res = await axios_1.default.post(`${_constants_1.APP_URL}/discover`, {
                    data: {
                        datasetId: 1,
                        version: 1,
                    },
                });
                expect(res.status).toEqual(200);
                expect(res.data).toEqual({
                    status: 400,
                    error: 'the request was invalid',
                    info: 'body.data.paths is a required field',
                });
            });
            it('must be an array', async () => {
                const res = await axios_1.default.post(`${_constants_1.APP_URL}/discover`, {
                    data: {
                        datasetId: 1,
                        version: 1,
                        paths: 'foo',
                    },
                });
                expect(res.status).toEqual(200);
                expect(res.data.status).toEqual(400);
            });
            it('must have at least one item', async () => {
                const res = await axios_1.default.post(`${_constants_1.APP_URL}/discover`, {
                    data: {
                        datasetId: 1,
                        version: 1,
                        paths: [],
                    },
                });
                expect(res.status).toEqual(200);
                expect(res.data).toEqual({
                    status: 400,
                    error: 'the request was invalid',
                    info: 'body.data.paths field must have at least 1 items,\nbody.data.paths is a required field',
                });
            });
        });
        describe('archiveName body param', () => {
            it('is only valid if more than one path is selected', async () => {
                const res = await axios_1.default.post(`${_constants_1.APP_URL}/discover`, {
                    data: {
                        datasetId: 1,
                        version: 1,
                        paths: ['foo'],
                        archiveName: 'test',
                    },
                });
                expect(res.status).toEqual(200);
                expect(res.data).toEqual({
                    status: 400,
                    error: 'the request was invalid',
                    info: 'body.data.archiveName can only be specified when multiple paths are specified',
                });
            });
        });
    });
});
describe('server error', () => {
    describe('invalid download manifest', () => {
        it('unable to fetch the manifest', async () => {
            await utils_1.assertErrorResponseInBody('this_file_is_not_there', _constants_2.ErrorResponses.UNKNOWN);
        });
        describe('size key', () => {
            it('is invalid json', async () => {
                await utils_1.assertErrorResponseInBody('size-key-invalid.json', _constants_2.ErrorResponses.INVALID_JSON);
            });
            it('is incorrect (e.g. is not numeric)', async () => {
                await utils_1.assertErrorResponseInBody('size-key-incorrect.json', _constants_2.ErrorResponses.HEADER_INVALID);
            });
            it('is not found', async () => {
                await utils_1.assertErrorResponseInBody('size-key-missing.json', _constants_2.ErrorResponses.HEADER_INVALID);
            });
            it('no size or data key', async () => {
                await utils_1.assertErrorResponseInBody('empty-object.json', _constants_2.ErrorResponses.NO_HEADER);
            });
            it('is after data key', async () => {
                await utils_1.assertErrorResponseInBody('size-key-after-data-key.json', _constants_2.ErrorResponses.HEADER_INVALID);
            });
        });
        describe('data key', () => {
            it('is invalid json', async () => {
                await utils_1.assertErrorResponseInBody('data-key-invalid.json', _constants_2.ErrorResponses.INVALID_JSON);
            });
            it('is incorrect (e.g. not an array)', async () => {
                await utils_1.assertErrorResponseInBody('data-key-incorrect.json', _constants_2.ErrorResponses.DATA_EMPTY);
            });
            it('is not found', async () => {
                await utils_1.assertErrorResponseInBody('data-key-missing.json', _constants_2.ErrorResponses.DATA_EMPTY);
            });
            it('is an empty array', async () => {
                await utils_1.assertErrorResponseInBody('data-empty-array.json', _constants_2.ErrorResponses.DATA_EMPTY);
            });
        });
    });
});
describe('unprocessable entity', () => {
    it('download is too large', async () => {
        await utils_1.assertErrorResponseInBody('size-key-too-large.json', _constants_2.ErrorResponses.SIZE_TOO_LARGE, 422);
    });
});

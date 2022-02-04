"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertErrorResponseInBody = exports.assertZipResults = void 0;
const axios_1 = __importDefault(require("axios"));
// eslint-disable-next-line import/no-extraneous-dependencies
const unzipper_1 = require("unzipper");
const utils_1 = require("../utils");
const _constants_1 = require("../_constants");
const _constants_2 = require("./_constants");
/**
 * why?
 * handling the asyncrhonous nature of these tests is non trivial
 * we need to await and assert against an intial response
 * then stream the zip archive back out to assert against its contents
 * you need to remember to reject the promise when assertions fail,
 * otherwise the promise resolves and the test passes, even though something went wrong
 */
async function assertZipResults(testManifestFile, totalAssertions, expectedPathAssertions, errorFileAssertions) {
    const res = await axios_1.default.post(_constants_2.APP_URL_WITH_API_KEY, {
        data: {
            nodeIds: [testManifestFile],
        },
    }, { responseType: 'stream' });
    expect.assertions(totalAssertions + 2);
    return new Promise((resolve, reject) => {
        try {
            expect(res.status).toEqual(200);
            expect(res.headers[utils_1.ContentHeaders.TYPE]).toEqual(utils_1.ContentTypes.ZIP);
            const expectedPaths = [];
            res.data
                .pipe(unzipper_1.Parse())
                .on('entry', (entry) => {
                expectedPaths.push(entry.path);
                if (entry.path === _constants_1.ErrorFile.NAME && errorFileAssertions) {
                    return entry
                        .buffer()
                        .then(buffer => {
                        try {
                            const errorFile = buffer.toString('utf8');
                            errorFileAssertions(errorFile);
                        }
                        catch (e) {
                            reject(e);
                        }
                    })
                        .catch(e => reject(e));
                }
                return entry.autodrain();
            })
                .on('finish', () => {
                try {
                    expectedPathAssertions(expectedPaths);
                    resolve();
                }
                catch (e) {
                    reject(e);
                }
            });
        }
        catch (e) {
            reject(e);
        }
    });
}
exports.assertZipResults = assertZipResults;
/**
 * for most error cases, we expect to return a 200,
 * but have the body of the response include the error info
 */
async function assertErrorResponseInBody(manifest, error, responseBodyStatus = 500) {
    const res = await postWithTestManifest(manifest);
    expect(res.status).toEqual(200);
    expect(res.data.status).toEqual(responseBodyStatus);
    expect(res.data.error).toEqual(error);
}
exports.assertErrorResponseInBody = assertErrorResponseInBody;
async function postWithTestManifest(manifest) {
    return axios_1.default.post(_constants_2.APP_URL_WITH_API_KEY, {
        data: {
            nodeIds: [manifest],
        },
    });
}

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const _constants_1 = require("./_constants");
describe('integration test health check', () => {
    it('app server is running', async () => {
        const appHealth = await axios_1.default.get(`${_constants_1.APP_URL}/health`);
        expect(appHealth.status).toEqual(200);
    });
    it('test file server is running', async () => {
        const fileServerHealth = await axios_1.default.get(`${_constants_1.FILE_URL}/health`);
        expect(fileServerHealth.status).toEqual(204);
    });
});

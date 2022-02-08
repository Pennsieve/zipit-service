"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FILE_URL = exports.APP_URL_WITH_API_KEY = exports.APP_URL = void 0;
const _constants_1 = require("../_constants");
exports.APP_URL = `http://localhost:${_constants_1.PORT}`;
exports.APP_URL_WITH_API_KEY = `http://localhost:${_constants_1.PORT}?api_key=foo`;
exports.FILE_URL = `http://localhost:${_constants_1.TEST_FILE_SERVER_PORT}`;

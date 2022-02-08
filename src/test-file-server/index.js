"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const testFileServer_1 = require("./testFileServer");
const logger_1 = require("../logger");
const logger = logger_1.getLogger('test-file-server/index.ts');
http_1.createServer(testFileServer_1.testApp).listen(4001, () => logger.info('test server listening on port 4001'));

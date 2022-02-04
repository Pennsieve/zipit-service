"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const error_middleware_1 = require("./error.middleware");
const validators_1 = require("./validators");
const download_handler_1 = require("./download.handler");
exports.app = express_1.default();
exports.app.use(express_1.default.json());
exports.app.use(express_1.default.urlencoded({ extended: true }));
exports.app.get('/health', (_, response) => response.status(200).json({ status: 'healthy' }));
exports.app.post('/', download_handler_1.downloadHandler(validators_1.validateApiRequest));
exports.app.post('/discover', download_handler_1.downloadHandler(validators_1.validateDiscoverRequest));
exports.app.use(error_middleware_1.errorMiddleware);

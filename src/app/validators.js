// prettier-ignore
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDiscoverRequest = exports.validateApiRequest = void 0;
const _schema_1 = require("./_schema");
const _constants_1 = require("../_constants");
/**
 * validate a request for the API download manifest
 * @param req
 */
exports.validateApiRequest = req => {
    var _a;
    const { query, body } = _schema_1.PackagesRequestSchema.validateSync(req, {
        abortEarly: false,
        stripUnknown: true,
    });
    return {
        manifestUrl: `${_constants_1.API_URL}${_constants_1.PACKAGES_PATH}${_constants_1.MANIFEST_PATH}?api_key=${query.api_key}`,
        manifestBody: body.data,
        isSingleSelection: body.data.nodeIds.length === 1,
        archiveName: (_a = body.data.archiveName) !== null && _a !== void 0 ? _a : '',
        determineSingleFileName: body.data.fileIds && body.data.fileIds.length
            ? (manifest) => manifest.fileName
            : (manifest) => {
                const { packageName } = manifest;
                if (packageName) {
                    const { fileExtension } = manifest;
                    if (fileExtension) {
                        const extensionNoDot = fileExtension.replace(/^\./g, ''); //remove dot if it is the first character
                        const name = packageName.replace(extensionNoDot, '').replace(/\.$/g, ''); //remove the file extension and the dot if it is at the end
                        return `${name}.${extensionNoDot}`;
                    }
                }
                return manifest.fileName;
            },
    };
};
/**
 * validate a request for the discover download manifest
 * @param req
 */
exports.validateDiscoverRequest = req => {
    const { body: { data: { datasetId, version, paths, rootPath, archiveName }, }, } = _schema_1.DiscoverRequestSchema.validateSync(req, {
        abortEarly: false,
        stripUnknown: true,
    });
    return {
        manifestUrl: `${_constants_1.API_URL}/discover/datasets/${datasetId}/versions/${version}/files/download-manifest`,
        manifestBody: { paths, rootPath },
        isSingleSelection: paths.length === 1,
        archiveName: archiveName !== null && archiveName !== void 0 ? archiveName : '',
        determineSingleFileName: (manifest) => manifest.fileName,
    };
};

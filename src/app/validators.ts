import { Request } from 'express';
import { FileManifest } from '../streams/_model';
import { DiscoverRequestSchema, PackagesRequestSchema } from './_schema';
import { API_URL, MANIFEST_PATH, PACKAGES_PATH } from '../_constants';

/**
 * a function that validates the incoming request,
 * and computes the data needed for the request handler to do its job
 * based on a discover request vs a platform request
 */
export type ValidateRequestAndGetHandlerConfig = (
  req: Request,
) => {
  manifestUrl: string;
  manifestBody: object;
  isSingleSelection: boolean;
  determineSingleFileName: (manifest: FileManifest) => string;
  archiveName: string;
};

/**
 * validate a request for the API download manifest
 * @param req
 */
export const validateApiRequest: ValidateRequestAndGetHandlerConfig = req => {
  const { query, body } = PackagesRequestSchema.validateSync(req, {
    abortEarly: false,
    stripUnknown: true,
  });

  return {
    manifestUrl: `${API_URL}${PACKAGES_PATH}${MANIFEST_PATH}?api_key=${query.api_key}`,
    manifestBody: body.data,
    isSingleSelection: body.data.nodeIds.length === 1,
    archiveName: body.data.archiveName ?? '',
    determineSingleFileName:
      body.data.fileIds && body.data.fileIds.length
        ? (manifest: FileManifest) => manifest.fileName
        : (manifest: FileManifest) => {
            const { packageName } = manifest;
            if (packageName) {
              const { fileExtension } = manifest;
              if (fileExtension) {
                const extensionNoDot = fileExtension.replace(/^\./g,''); //remove dot if it is the first character
                const name = packageName.replace(extensionNoDot,'').replace(/\.$/g,''); //remove the file extension and the dot if it is at the end
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
export const validateDiscoverRequest: ValidateRequestAndGetHandlerConfig = req => {
  const {
    body: {
      data: { datasetId, version, paths, rootPath, archiveName, userToken},
    },
  } = DiscoverRequestSchema.validateSync(req, {
    abortEarly: false,
    stripUnknown: true,
  });

  return {
    manifestUrl: `${API_URL}/discover/datasets/${datasetId}/versions/${version}/files/download-manifest/?api_key=${userToken}`,
    manifestBody: { paths, rootPath },
    isSingleSelection: paths.length === 1,
    archiveName: archiveName ?? '',
    determineSingleFileName: (manifest: FileManifest) => manifest.fileName,
  };
};

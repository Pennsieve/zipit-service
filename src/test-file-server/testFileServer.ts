/**
 * this file exports an http server that will respond to requests for files in this directory
 * it allows me to write integration tests that mimic responses from the API
 */
import express, { RequestHandler } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream';
import { array, object, string } from 'yup';
import { getLogger } from '../logger';

export const TEST_PACKAGE_ID = 'testPackage';

const logger = getLogger('testFileServer.ts');

/**
 * mimics the download-manifest endpoint in pennsieve-api
 */
const stubManifestApi: RequestHandler = async (req, res) => {
  try {
    const { nodeIds } = object()
      .shape({
        nodeIds: array()
          .of(string())
          .min(1)
          .required(),
      })
      .validateSync(req.body);

    const file = nodeIds[0];

    logger.silly(`attempting to produce read stream for file ${file}`);
    const readStream = createReadStream(join(__dirname, 'manifests', file));
    logger.silly(`created read stream for file ${file}`);

    return pipeline(readStream, res, e => {
      if (e) {
        logger.debug(e?.message ?? '');
        if (!res.headersSent) {
          res.status(500).send(JSON.stringify(e?.stack));
        }
      }
    });
  } catch (e) {
    logger.debug(e.message);
    return res.status(500).send(JSON.stringify(e.stack));
  }
};

/**
 * mimics the package file endpoint in pennsieve-api
 */
const stubFileApi: RequestHandler = async (req, res) => {
  try {
    const {
      params: { name },
    } = object()
      .shape({
        params: object().shape({
          name: string().required(),
        }),
      })
      .validateSync(req);

    return res.json({
      url: `${process.env.API_URL}/file/${name}`,
    });
  } catch (e) {
    logger.debug(e.message);
    return res.status(500).send(JSON.stringify(e.stack));
  }
};

/**
 * provides test files
 */
const testFileHandler: RequestHandler = async (req, res) => {
  try {
    const {
      params: { name },
    } = object()
      .shape({
        params: object().shape({
          name: string().required(),
        }),
      })
      .validateSync(req);

    const readStream = createReadStream(join(__dirname, 'files', name));
    logger.silly(`created read stream for file ${name}`);

    return pipeline(readStream, res, e => {
      if (e) {
        logger.debug(e?.message ?? '');
        if (!res.headersSent) {
          res.status(500).send(JSON.stringify(e?.stack));
        }
      }
    });
  } catch (e) {
    logger.debug(e.message);
    return res.status(500).send(JSON.stringify(e.stack));
  }
};

export const testApp = express();
testApp.use(express.json());

testApp.get('/health', (_, response) => response.status(204).send());

testApp.post('/manifest', stubManifestApi);
testApp.get(`/${TEST_PACKAGE_ID}/files/:name`, stubFileApi);
testApp.get('/file/:name', testFileHandler);

import axios from 'axios';
import { APP_URL, APP_URL_WITH_API_KEY } from './_constants';
import { assertErrorResponseInBody } from './utils';
import { ErrorResponses } from '../_constants';

describe('bad request', () => {
  describe('platform endpoint', () => {
    describe('api_key query param', () => {
      it('is required', async () => {
        const res = await axios.post(APP_URL, {
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
        const res = await axios.post(APP_URL_WITH_API_KEY);
        expect(res.status).toEqual(200);
        expect(res.data).toEqual({
          status: 400,
          error: 'the request was invalid',
          info: 'body.data.nodeIds is a required field',
        });
      });

      it('must be an array', async () => {
        const res = await axios.post(APP_URL_WITH_API_KEY, {
          data: {
            nodeIds: 'foo',
          },
        });
        expect(res.status).toEqual(200);
        expect(res.data.status).toEqual(400);
      });

      it('must have at least one item', async () => {
        const res = await axios.post(APP_URL_WITH_API_KEY, {
          data: {
            nodeIds: [],
          },
        });
        expect(res.status).toEqual(200);
        expect(res.data).toEqual({
          status: 400,
          error: 'the request was invalid',
          info:
            'body.data.nodeIds field must have at least 1 items,\nbody.data.nodeIds is a required field',
        });
      });
    });

    describe('fileIds body param', () => {
      it('if provided, must be numeric', async () => {
        const res = await axios.post(APP_URL_WITH_API_KEY, {
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
        const res = await axios.post(APP_URL_WITH_API_KEY, {
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
        const res = await axios.post(APP_URL_WITH_API_KEY, {
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
          info:
            'body.data.archiveName can only be specified when multiple nodeIds are specified',
        });
      });
    });
  });

  describe('discover endpoint', () => {
    describe('userToken body param', () => {
      it('is not required', async () => {
        const res = await axios.post(`${APP_URL}/discover`, {
          data: {
            paths: ['foo'],
            version: 1,
            datasetId: 1,
          },
        });
        expect(res.status).toEqual(200);
        // expect(res.data).toEqual({
        //   status: 400,
        //   error: 'the request was invalid',
        //   info: 'body.data.userToken is a required field',
        // });
      });
    });
    describe('datasetId body param', () => {
      it('is required', async () => {
        const res = await axios.post(`${APP_URL}/discover`, {
          data: {
            paths: ['foo'],
            version: 1,
            userToken: "abc123",
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
        const res = await axios.post(`${APP_URL}/discover`, {
          data: {
            paths: ['foo'],
            version: 1,
            datasetId: 'foo',
            userToken: "abc123",
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
        const res = await axios.post(`${APP_URL}/discover`, {
          data: {
            paths: ['foo'],
            datasetId: 1,
            userToken: "abc123",
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
        const res = await axios.post(`${APP_URL}/discover`, {
          data: {
            paths: ['foo'],
            version: 'foo',
            datasetId: 1,
            userToken: "abc123",
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
        const res = await axios.post(`${APP_URL}/discover`, {
          data: {
            datasetId: 1,
            version: 1,
            userToken: "abc123",
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
        const res = await axios.post(`${APP_URL}/discover`, {
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
        const res = await axios.post(`${APP_URL}/discover`, {
          data: {
            datasetId: 1,
            version: 1,
            paths: [],
            userToken: "abc123",
          },
        });
        expect(res.status).toEqual(200);
        expect(res.data).toEqual({
          status: 400,
          error: 'the request was invalid',
          info:
            'body.data.paths field must have at least 1 items,\nbody.data.paths is a required field',
        });
      });
    });

    describe('archiveName body param', () => {
      it('is only valid if more than one path is selected', async () => {
        const res = await axios.post(`${APP_URL}/discover`, {
          data: {
            datasetId: 1,
            version: 1,
            paths: ['foo'],
            archiveName: 'test',
            userToken: "abc123",
          },
        });
        expect(res.status).toEqual(200);
        expect(res.data).toEqual({
          status: 400,
          error: 'the request was invalid',
          info:
            'body.data.archiveName can only be specified when multiple paths are specified',
        });
      });
    });
  });
});

describe('server error', () => {
  describe('invalid download manifest', () => {
    it('unable to fetch the manifest', async () => {
      await assertErrorResponseInBody(
        'this_file_is_not_there',
        ErrorResponses.UNKNOWN,
      );
    });

    describe('size key', () => {
      it('is invalid json', async () => {
        await assertErrorResponseInBody(
          'size-key-invalid.json',
          ErrorResponses.INVALID_JSON,
        );
      });

      it('is incorrect (e.g. is not numeric)', async () => {
        await assertErrorResponseInBody(
          'size-key-incorrect.json',
          ErrorResponses.HEADER_INVALID,
        );
      });

      it('is not found', async () => {
        await assertErrorResponseInBody(
          'size-key-missing.json',
          ErrorResponses.HEADER_INVALID,
        );
      });

      it('no size or data key', async () => {
        await assertErrorResponseInBody(
          'empty-object.json',
          ErrorResponses.NO_HEADER,
        );
      });

      it('is after data key', async () => {
        await assertErrorResponseInBody(
          'size-key-after-data-key.json',
          ErrorResponses.HEADER_INVALID,
        );
      });
    });

    describe('data key', () => {
      it('is invalid json', async () => {
        await assertErrorResponseInBody(
          'data-key-invalid.json',
          ErrorResponses.INVALID_JSON,
        );
      });

      it('is incorrect (e.g. not an array)', async () => {
        await assertErrorResponseInBody(
          'data-key-incorrect.json',
          ErrorResponses.DATA_EMPTY,
        );
      });

      it('is not found', async () => {
        await assertErrorResponseInBody(
          'data-key-missing.json',
          ErrorResponses.DATA_EMPTY,
        );
      });

      it('is an empty array', async () => {
        await assertErrorResponseInBody(
          'data-empty-array.json',
          ErrorResponses.DATA_EMPTY,
        );
      });
    });
  });
});

describe('unprocessable entity', () => {
  it('download is too large', async () => {
    await assertErrorResponseInBody(
      'size-key-too-large.json',
      ErrorResponses.SIZE_TOO_LARGE,
      422,
    );
  });
});

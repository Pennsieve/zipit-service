import axios, { AxiosResponse } from 'axios';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Entry, Parse } from 'unzipper';
import { ContentHeaders, ContentTypes } from '../utils';
import { ErrorFile } from '../_constants';
import { APP_URL_WITH_API_KEY } from './_constants';

/**
 * why?
 * handling the asyncrhonous nature of these tests is non trivial
 * we need to await and assert against an intial response
 * then stream the zip archive back out to assert against its contents
 * you need to remember to reject the promise when assertions fail,
 * otherwise the promise resolves and the test passes, even though something went wrong
 */
export async function assertZipResults(
  testManifestFile: string,
  totalAssertions: number,
  expectedPathAssertions: (expectedPaths: string[]) => void,
  errorFileAssertions?: (errorFile: string) => void,
): Promise<void> {
  const res = await axios.post(
    APP_URL_WITH_API_KEY,
    {
      data: {
        nodeIds: [testManifestFile],
      },
    },
    { responseType: 'stream' },
  );

  expect.assertions(totalAssertions + 2);

  return new Promise((resolve, reject) => {
    try {
      expect(res.status).toEqual(200);
      expect(res.headers[ContentHeaders.TYPE]).toEqual(ContentTypes.ZIP);

      const expectedPaths: string[] = [];

      res.data
        .pipe(Parse())
        .on('entry', (entry: Entry) => {
          expectedPaths.push(entry.path);
          if (entry.path === ErrorFile.NAME && errorFileAssertions) {
            return entry
              .buffer()
              .then(buffer => {
                try {
                  const errorFile = buffer.toString('utf8');
                  errorFileAssertions(errorFile);
                } catch (e) {
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
          } catch (e) {
            reject(e);
          }
        });
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * for most error cases, we expect to return a 200,
 * but have the body of the response include the error info
 */
export async function assertErrorResponseInBody(
  manifest: string,
  error: string,
  responseBodyStatus = 500,
): Promise<void> {
  const res = await postWithTestManifest(manifest);
  expect(res.status).toEqual(200);
  expect(res.data.status).toEqual(responseBodyStatus);
  expect(res.data.error).toEqual(error);
}

async function postWithTestManifest(manifest: string): Promise<AxiosResponse> {
  return axios.post(APP_URL_WITH_API_KEY, {
    data: {
      nodeIds: [manifest],
    },
  });
}

import axios from 'axios';
import { assertZipResults } from './utils';
import { ErrorFile, ErrorResponses } from '../_constants';
import { APP_URL_WITH_API_KEY } from './_constants';
import {
  ContentDispositionPrefix,
  ContentHeaders,
  ContentTypes,
} from '../utils';
import { getLogger } from '../logger';

const logger = getLogger('ok.spec.ts');

describe('successful download', () => {
  it('basic case: one top level file, one file in a directory, one file in a nested directory', async () => {
    return assertZipResults('manifest-basic.json', 4, expectedPaths => {
      expect(expectedPaths.includes(ErrorFile.NAME)).toBe(false);
      expect(expectedPaths.includes('file1.txt')).toBe(true);
      expect(expectedPaths.includes('dir1/file2.txt')).toBe(true);
      expect(expectedPaths.includes('dir1/dir2/file3.txt')).toBe(true);
    });
  });

  it('handling of duplicate file paths/names', async () => {
    return assertZipResults('manifest-duplicates.json', 2, expectedPaths => {
      expect(expectedPaths.length).toEqual(4);
      expect(new Set(expectedPaths).size).toEqual(4);
    });
  });

  describe('when a single PACKAGE is selected', () => {
    describe('and it only contains one file', () => {
      it("content type is octet, and the file name the package name without its extension but with the source file's extension", async () => {
        const res = await axios.post(
          APP_URL_WITH_API_KEY,
          {
            data: {
              nodeIds: ['manifest-one-package-one-file.json'],
            },
          },
          { responseType: 'stream' },
        );
        expect.assertions(3);
        return new Promise((resolve, reject) => {
          try {
            expect(res.status).toEqual(200);
            expect(res.headers[ContentHeaders.TYPE]).toEqual(
              ContentTypes.OCTET,
            );
            expect(res.headers[ContentHeaders.DISPOSITION]).toEqual(
              `${ContentDispositionPrefix}"file1.txt"`,
            );
            resolve();
            res.data.on('error', (e: unknown) => reject(e));
          } catch (e) {
            reject(e);
          }
        });
      });

      it("content type is octet, and the file name the package name (it has no extension) with the source file's extension", async () => {
        const res = await axios.post(
          APP_URL_WITH_API_KEY,
          {
            data: {
              nodeIds: ['manifest-one-package-one-file-noextension.json'],
            },
          },
          { responseType: 'stream' },
        );
        expect.assertions(3);
        return new Promise((resolve, reject) => {
          try {
            expect(res.status).toEqual(200);
            expect(res.headers[ContentHeaders.TYPE]).toEqual(
              ContentTypes.OCTET,
            );
            expect(res.headers[ContentHeaders.DISPOSITION]).toEqual(
              `${ContentDispositionPrefix}"file1.txt"`,
            );
            resolve();
            res.data.on('error', (e: unknown) => reject(e));
          } catch (e) {
            reject(e);
          }
        });
      });

    it("content type is octet, and the file name the package name has the double-extension", async () => {
        const res = await axios.post(
          APP_URL_WITH_API_KEY,
          {
            data: {
              nodeIds: ['manifest-one-package-one-file-double-extension.json'],
            },
          },
          { responseType: 'stream' },
        );
        expect.assertions(3);
        return new Promise((resolve, reject) => {
          try {
            expect(res.status).toEqual(200);
            expect(res.headers[ContentHeaders.TYPE]).toEqual(
              ContentTypes.OCTET,
            );
            expect(res.headers[ContentHeaders.DISPOSITION]).toEqual(
              `${ContentDispositionPrefix}"file1.ome.tiff"`,
            );
            resolve();
            res.data.on('error', (e: unknown) => reject(e));
          } catch (e) {
            reject(e);
          }
        });
      });

      it('download is not zipped', async () => {
        const res = await axios.post(
          APP_URL_WITH_API_KEY,
          {
            data: {
              nodeIds: ['manifest-one-package-one-file.json'],
            },
          },
          { responseType: 'stream' },
        );
        expect.assertions(1);
        return new Promise((resolve, reject) => {
          try {
            let contents = '';
            res.data.on(
              'data',
              // eslint-disable-next-line no-return-assign
              (chunk: string | symbol) => (contents += chunk.toString()),
            );
            res.data.on('end', () => {
              expect(contents).toEqual('hi i am some test\n');
              resolve();
            });
          } catch (e) {
            reject(e);
          }
        });
      });
    });

    describe('and it contains multiple files', () => {
      it('content type is zip, and the file name is package name', async () => {
        const res = await axios.post(
          APP_URL_WITH_API_KEY,
          {
            data: {
              nodeIds: ['manifest-one-package-two-files.json'],
            },
          },
          { responseType: 'stream' },
        );
        expect.assertions(3);
        return new Promise((resolve, reject) => {
          try {
            expect(res.status).toEqual(200);
            expect(res.headers[ContentHeaders.TYPE]).toEqual(ContentTypes.ZIP);
            expect(res.headers[ContentHeaders.DISPOSITION]).toEqual(
              `${ContentDispositionPrefix}"package.zip"`,
            );
            resolve();
            res.data.on('error', (e: unknown) => reject(e));
          } catch (e) {
            reject(e);
          }
        });
      });

      it('download is zipped', async () => {
        return assertZipResults(
          'manifest-one-package-two-files.json',
          2,
          expectedPaths => {
            expect(expectedPaths.includes('package/file1.txt')).toBe(true);
            expect(expectedPaths.includes('package/file2.txt')).toBe(true);
          },
        );
      });
    });
  });

  describe('when a single SOURCE FILE is selected', () => {
    it('content type is octet, and the file name is the source file name', async () => {
      const res = await axios.post(
        APP_URL_WITH_API_KEY,
        {
          data: {
            nodeIds: ['manifest-one-package-one-file.json'],
            fileIds: [1],
          },
        },
        { responseType: 'stream' },
      );
      expect.assertions(3);
      return new Promise((resolve, reject) => {
        try {
          expect(res.status).toEqual(200);
          expect(res.headers[ContentHeaders.TYPE]).toEqual(ContentTypes.OCTET);
          expect(res.headers[ContentHeaders.DISPOSITION]).toEqual(
            `${ContentDispositionPrefix}"file1.txt"`,
          );
          resolve();
          res.data.on('error', (e: unknown) => reject(e));
        } catch (e) {
          reject(e);
        }
      });
    });

    it('download is not zipped', async () => {
      const res = await axios.post(
        APP_URL_WITH_API_KEY,
        {
          data: {
            nodeIds: ['manifest-one-package-one-file.json'],
          },
        },
        { responseType: 'stream' },
      );
      expect.assertions(1);
      return new Promise((resolve, reject) => {
        try {
          let contents = '';
          res.data.on(
            'data',
            // eslint-disable-next-line no-return-assign
            (chunk: string | symbol) => (contents += chunk.toString()),
          );
          res.data.on('end', () => {
            expect(contents).toEqual('hi i am some test\n');
            resolve();
          });
        } catch (e) {
          reject(e);
        }
      });
    });
  });

  describe('when multiple SOURCE FILES are selected', () => {
    it('content type is zip, and the file name is package name', async () => {
      const res = await axios.post(
        APP_URL_WITH_API_KEY,
        {
          data: {
            nodeIds: ['manifest-one-package-two-files.json'],
            // ignored by test endpoint,
            // just making sure the archiver logic is the same as for packages
            // and documenting this behavior
            fileIds: [1, 2],
          },
        },
        { responseType: 'stream' },
      );
      expect.assertions(3);
      return new Promise((resolve, reject) => {
        try {
          expect(res.status).toEqual(200);
          expect(res.headers[ContentHeaders.TYPE]).toEqual(ContentTypes.ZIP);
          expect(res.headers[ContentHeaders.DISPOSITION]).toEqual(
            `${ContentDispositionPrefix}"package.zip"`,
          );
          resolve();
          res.data.on('error', (e: unknown) => reject(e));
        } catch (e) {
          reject(e);
        }
      });
    });

    it('download is zipped', async () => {
      return assertZipResults(
        'manifest-one-package-two-files.json',
        2,
        expectedPaths => {
          expect(expectedPaths.includes('package/file1.txt')).toBe(true);
          expect(expectedPaths.includes('package/file2.txt')).toBe(true);
        },
      );
    });
  });

  it('using a specified archive name for multi-file download', async () => {
    const res = await axios.post(
      APP_URL_WITH_API_KEY,
      {
        data: {
          nodeIds: [
            'manifest-basic.json',
            'this-one-is-ignored-by-test-file-server',
          ],
          archiveName: 'test-name',
        },
      },
      { responseType: 'stream' },
    );

    expect.assertions(3);
    return new Promise((resolve, reject) => {
      try {
        expect(res.status).toEqual(200);
        expect(res.headers[ContentHeaders.TYPE]).toEqual(ContentTypes.ZIP);
        expect(res.headers[ContentHeaders.DISPOSITION]).toEqual(
          `${ContentDispositionPrefix}"test-name.zip"`,
        );
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  });
});

describe('handling of unfound files', () => {
  it('first file', async () => {
    return assertZipResults(
      'manifest-first-missing.json',
      5,
      expectedPaths => {
        expect(expectedPaths.includes('file1.txt')).toBe(false);
        expect(expectedPaths.includes('dir1/file2.txt')).toBe(true);
        expect(expectedPaths.includes('dir1/dir2/file3.txt')).toBe(true);
      },
      errorFile => {
        const [fileNotFound, ...rest] = errorFile.split('\n');
        expect(rest).toHaveLength(0);
        expect(fileNotFound).toEqual(`${ErrorFile.FILE}file1.txt`);
      },
    );
  });

  it('subsequent file', async () => {
    return assertZipResults(
      'manifest-one-missing.json',
      5,
      expectedPaths => {
        expect(expectedPaths.includes('file1.txt')).toBe(true);
        expect(expectedPaths.includes('dir1/file2.txt')).toBe(false);
        expect(expectedPaths.includes('dir1/dir2/file3.txt')).toBe(true);
      },
      errorFile => {
        const [fileNotFound, ...rest] = errorFile.split('\n');
        expect(rest).toHaveLength(0);
        expect(fileNotFound).toEqual(`${ErrorFile.FILE}dir1/file2.txt`);
      },
    );
  });
});

describe(`errors after 200 status is sent
    TODO: these tests are non-deterministic.

        We need to send enough data so that the first emission from the composed pipeline occurs before an error event occurs in the json stream.
        ¯\\_(ツ)_/¯
        "It Works On My Machine" somewhere between 200 and 600 entries.
        The test files have 700 to be safe.

    `, () => {
  describe('if there is a json parsing error after streaming has started', () => {
    it('the whole stream dies and no more files are processed', async () => {
      return assertZipResults(
        'big-with-invalid.json',
        4,
        expectedPaths => {
          logger.silly(
            `files processed in this test: ${expectedPaths.join(', ')}`,
          );
          expect(expectedPaths.length).toBeGreaterThan(2);
          expect(expectedPaths.length).toBeLessThan(698);
        },
        errorFile => {
          expect(errorFile.startsWith(`${ErrorFile.FATAL}Invalid JSON`)).toBe(
            true,
          );
          expect(errorFile.split('\n')).toHaveLength(1);
        },
      );
    });
  });

  describe('if there is a json validation error after the stream has started', () => {
    it('we can recover and continue processing files', async () => {
      return assertZipResults(
        'big-with-incorrect.json',
        4,
        expectedPaths => {
          logger.silly(
            `files processed in this test: ${expectedPaths.join(', ')}`,
          );
          expect(expectedPaths.length).toBeGreaterThan(2);
          expect(expectedPaths.length).toEqual(700);
        },
        errorFile => {
          expect(
            errorFile.startsWith(
              `${ErrorFile.OTHER}${ErrorResponses.MANIFEST_INVALID}`,
            ),
          ).toBe(true);
          expect(errorFile.split('\n')).toHaveLength(1);
        },
      );
    });
  });
});

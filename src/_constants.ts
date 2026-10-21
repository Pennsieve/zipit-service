export const PORT = process.env.PORT ?? 8080;

export const TEST_FILE_SERVER_PORT = process.env.TEST_FILE_SERVER_PORT ?? 4001;

export const LOG_LEVEL = process.env.LOG_LEVEL ?? 'verbose';

export const API_URL = process.env.API_URL ?? 'https://api.pennsieve.net';

export const PACKAGES_PATH = process.env.PACKAGES_PATH ?? '/packages';

export const MANIFEST_PATH = process.env.MANIFEST_PATH ?? '/download-manifest';

export const MAX_ARCHIVE_SIZE = parseInt(
  process.env.MAX_ARCHIVE_SIZE ?? '5000000000',
  10,
);

export enum ErrorResponses {
  UNKNOWN = 'there was an error creating the zip, please check the logs',
  REQUEST_INVALID = 'the request was invalid',
  DATA_EMPTY = 'no data to download',
  MANIFEST_INVALID = 'manifest had unexpected shape',
  HEADER_INVALID = 'manifest "header" property invalid...it should be the first key in the manifest json',
  SIZE_TOO_LARGE = 'archive is too big to download',
  NO_HEADER = 'manifest "header" property not found...it should be the first key in the manifest json',
  INVALID_JSON = 'could not parse manifest json',
}

export enum ErrorFile {
  NAME = '!ERROR.txt',
  SAVE = 'Unable to save error log to archive!',
  FILE = 'FILE Error: ',
  FATAL = 'FATAL Error: ',
  OTHER = 'Error: ',
}

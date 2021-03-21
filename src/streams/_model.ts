import { Readable } from 'stream';

export interface ManifestHeader {
  header: {
    count: number;
    size: number;
  };
}

export interface FileManifest {
  path: string[];
  fileName: string;
  packageName?: string;
  url: string;
  fileExtension?: string;
}

export interface ResolvedFileManifest {
  manifest?: FileManifest;
  file$: Readable | Error;
}

import { writeFileSync } from 'fs';
import { join } from 'path';
import { FileManifest } from '../streams/_model';

const HOW_MANY = 50;
const HOW_BIG = HOW_MANY;
const TEST_URL = 'https://zipit-test-1.s3.amazonaws.com/';

interface ManifestResponse {
  size: number;
  data: FileManifest[];
}

const createBigManifest = (): ManifestResponse => {
  const manifests: FileManifest[] = new Array(HOW_MANY).fill(0).map((_, i) => ({
    path: [],
    fileName: `file${i}.tif`,
    url: `${TEST_URL}file${i}.tif`,
  }));

  return {
    size: HOW_BIG,
    data: manifests,
  };
};

const saveBigManifest = (manifest: ManifestResponse): void => {
  const json = JSON.stringify(manifest, undefined, 2);
  writeFileSync(join(__dirname, 'manifests', 'big-s3-manifest.json'), json);
};

const main = (): void => {
  const manifest = createBigManifest();
  saveBigManifest(manifest);
};

main();

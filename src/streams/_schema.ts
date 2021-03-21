import { array, object, Schema, string } from 'yup';
import { FileManifest } from './_model';

export const ManifestSchema: Schema<FileManifest> = object().shape({
  path: array()
    .of(string())
    .min(0),
  fileName: string().required(),
  packageName: string().notRequired(),
  url: string().required(),
});

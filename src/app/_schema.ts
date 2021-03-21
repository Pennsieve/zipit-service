import { array, mixed, number, object, string } from 'yup';

const QueryParamsSchema = object()
  .shape({
    // eslint-disable-next-line @typescript-eslint/camelcase
    api_key: string().required(),
  })
  .required();

const PackagesBodySchema = object()
  .shape({
    data: object()
      .shape({
        nodeIds: array()
          .of(string())
          .min(1)
          .required(),
        fileIds: array()
          .of(number())
          .min(1)
          .notRequired(),
        archiveName: mixed().when('nodeIds', {
          is: v => v && v.length < 2,
          then: mixed().test(
            'archiveName',
            params =>
              `${params.path} can only be specified when multiple nodeIds are specified`,
            // eslint-disable-next-line func-names
            function(this, v) {
              return v === undefined;
            },
          ),
          otherwise: string().notRequired(),
        }),
      })
      .required(),
  })
  .required();

export const PackagesRequestSchema = object().shape({
  body: PackagesBodySchema,
  query: QueryParamsSchema,
});

export const SizeHeaderSchema = object().shape({
  header: object()
    .shape({
      size: number().required(),
      count: number().required(),
    })
    .required(),
});

export const DiscoverRequestSchema = object().shape({
  body: object().shape({
    data: object().shape({
      datasetId: number().required(),
      version: number().required(),
      paths: array()
        .of(string())
        .min(1)
        .required(),
      rootPath: string().notRequired(),
      archiveName: mixed().when('paths', {
        is: v => v && v.length < 2,
        then: mixed().test(
          'archiveName',
          params =>
            `${params.path} can only be specified when multiple paths are specified`,
          // eslint-disable-next-line func-names
          function(this, v) {
            return v === undefined;
          },
        ),
        otherwise: string().notRequired(),
      }),
    }),
  }),
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscoverRequestSchema = exports.SizeHeaderSchema = exports.PackagesRequestSchema = void 0;
const yup_1 = require("yup");
const QueryParamsSchema = yup_1.object()
    .shape({
    // eslint-disable-next-line @typescript-eslint/camelcase
    api_key: yup_1.string().required(),
})
    .required();
const PackagesBodySchema = yup_1.object()
    .shape({
    data: yup_1.object()
        .shape({
        nodeIds: yup_1.array()
            .of(yup_1.string())
            .min(1)
            .required(),
        fileIds: yup_1.array()
            .of(yup_1.number())
            .min(1)
            .notRequired(),
        archiveName: yup_1.mixed().when('nodeIds', {
            is: v => v && v.length < 2,
            then: yup_1.mixed().test('archiveName', params => `${params.path} can only be specified when multiple nodeIds are specified`, 
            // eslint-disable-next-line func-names
            function (v) {
                return v === undefined;
            }),
            otherwise: yup_1.string().notRequired(),
        }),
    })
        .required(),
})
    .required();
exports.PackagesRequestSchema = yup_1.object().shape({
    body: PackagesBodySchema,
    query: QueryParamsSchema,
});
exports.SizeHeaderSchema = yup_1.object().shape({
    header: yup_1.object()
        .shape({
        size: yup_1.number().required(),
        count: yup_1.number().required(),
    })
        .required(),
});
exports.DiscoverRequestSchema = yup_1.object().shape({
    body: yup_1.object().shape({
        data: yup_1.object().shape({
            datasetId: yup_1.number().required(),
            version: yup_1.number().required(),
            paths: yup_1.array()
                .of(yup_1.string())
                .min(1)
                .required(),
            rootPath: yup_1.string().notRequired(),
            archiveName: yup_1.mixed().when('paths', {
                is: v => v && v.length < 2,
                then: yup_1.mixed().test('archiveName', params => `${params.path} can only be specified when multiple paths are specified`, 
                // eslint-disable-next-line func-names
                function (v) {
                    return v === undefined;
                }),
                otherwise: yup_1.string().notRequired(),
            }),
        }),
    }),
});

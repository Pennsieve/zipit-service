"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManifestSchema = void 0;
const yup_1 = require("yup");
exports.ManifestSchema = yup_1.object().shape({
    path: yup_1.array()
        .of(yup_1.string())
        .min(0),
    fileName: yup_1.string().required(),
    packageName: yup_1.string().notRequired(),
    url: yup_1.string().required(),
});

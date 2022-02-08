"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const HOW_MANY = 50;
const HOW_BIG = HOW_MANY;
const TEST_URL = 'https://zipit-test-1.s3.amazonaws.com/';
const createBigManifest = () => {
    const manifests = new Array(HOW_MANY).fill(0).map((_, i) => ({
        path: [],
        fileName: `file${i}.tif`,
        url: `${TEST_URL}file${i}.tif`,
    }));
    return {
        size: HOW_BIG,
        data: manifests,
    };
};
const saveBigManifest = (manifest) => {
    const json = JSON.stringify(manifest, undefined, 2);
    fs_1.writeFileSync(path_1.join(__dirname, 'manifests', 'big-s3-manifest.json'), json);
};
const main = () => {
    const manifest = createBigManifest();
    saveBigManifest(manifest);
};
main();

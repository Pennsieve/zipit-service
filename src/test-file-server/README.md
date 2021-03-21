# Test File Server

This directory holds some code to provide endpoints for testing the app.
The intent is to mimic the behavior of pennsieve-api, and also serve test files without a network connection.

## Install Dependencies
* I'm assuming you've already run `npm install` from the root of the project.
* `ts-node`: this is just a utility to run typescript files in node without having to precompile them.
Alternatively, you could use `tsc` to emit the javascript files and run the same commands with `node` instead.
    

## Run stuff

*   start the file server (from the root of the zipit-service project): `npx ts-node src/test-file-server/index.ts`
*   create a big manifest file to test with: `npx ts-node src/test-file-server/createBigManifest.ts`
    * Note the values at the top of `createBigManifest.ts` that can be used to control things.



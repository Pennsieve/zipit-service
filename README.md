This document was last updated on June 30, 2020.

# zipit-service
A service that,  given the following:
- A list of Node ID's representing packages on the Pennsieve platform

Or

- A list of paths representing files on Pennsieve discover

Does the following:

1.  Makes a request to either `pennsieve-api` or `discover-service` for a **manifest** containing the folder structures and s3 urls of the corresponding files.
2.  Streams the resulting files into a zip archive with said folder structure.
3.  Returns a writeStream to force a download to the client.
    
# Scripts

## Install Dependencies
`npm i`

## Local development
### Compile
`npm run compile`

### Lint
`npm run lint`

### Test
`npm run test`
- Pipe the log outputs to `jq` for readability: `npm run test:jq`
- Silence the log output so only test results are printed: `npm run test:no-logs`

### Start development server
`npm start`

- `npm run start:local` start - manifest requests to the test file server
- `npm run start:nonprod` start - manifest requests to non-prod
- `npm run start:prod` start - manifest requests to prod
- `npm run start:<env>:jq` start, connected to `<env>`, piping logs to `jq` for readability

### Start [Test File Server](src/test-file-server/README.md)
`npm run start:tfs`

## Build

### Build Server for Production
`npm run build`

- `node dist/bundle.js` run the production build
- `docker build .` build a production docker container

### Run tests in a Docker container (CI)

- `npm run test:ci:build` 
- `npm run test:ci:run`
- `npm run test:ci:clean`

# Environment Variables

*   `PORT` 
    *   port that the server will run on.  
    *   Default: `8080`
*   `API_URL`
    *   url of pennsieve-api and discover-service
    *   Default: `https://api.pennsieve.net`
*   `PACKAGES_PATH`
    *   path to the packages endpoint
    *   Default: `/packages`
*   `MANIFEST_PATH`
    *   path of the api endpoint that will provide the manifest json
    *   Default: `/download-manifest`
*   `LOG_LEVEL`
    *   least severe level of message that the logger will emit.
    *   Default: `verbose`
*   `MAX_ARCHIVE_SIZE`
    *   maximum total uncompressed size of files that can be downloaded.
    *   Default `5000000000`
*   `TEST_FILE_SERVER_PORT` 
    *   port that the test file server will run on (only used for tests).  
    *   Default: `4001`
    
# Implementation Notes

Most of the complexity in this service lies in two places.  There are lots of comments in each of these files,
but here is some more context.

## [manifest.transform.ts](src/streams/manifest.transform.ts)

This is where each file gets downloaded from S3.  If we open too many concurrent requests to download
different S3 files, bad things can happen.  If those files are large, the network
bandwidth gets entirely consumed by a few of them, leaving other requests open, but stagnant.  Eventually,
the requests that _are_ open but _are not_ downloading any data, fail with a timeout.  The result is an archive where
random files are present, but incomplete.  The purpose of this file is to prevent that by invoking node's backpressure
mechanism such that only one file gets downloaded at a time.

## [archiver.handlers.ts](src/streams/archiver.handlers.ts)

This file exports the `ArchiverHandler` function, which generates the `next`, `error` and `end` event handlers that are registered on the stream
pipeline created in the main [route handler](src/app/download.handler.ts).
Calling `ArchiverHandler` creates a functional closure that encapsulates some state, which is referenced when
the pipeline emits events.  Based on where we are in the state machine when events happen, different business logic is relevant.  
There are three states in the process:

1. `Steps.AWAITING_HEADER` We expect the first event to be header information containing the total size of the download and file count.
2. `Steps.AWAITING_FIRST_FILE` Some special logic applies once the header gets received and before we have started streaming a response to the client. 
3. `Steps.STREAMING_RESPONSE` Final state where data is being sent to the client.

Much of the business logic in the state machine described above centers around error handling.  The
rest concerns the name of the file sent to the client, and handling duplicate file names.  

#### Archive naming logic

The following table breaks down the expected file name in each case:

Platform Endpoint

| Number of Packages Selected | Number of files in Package | Files Selected | Archive Name Provided | Result                                         |
| :-------------------------: | :------------------------: | :------------: | :-------------------: | :--------------------------------------------: |
| One                         | One                        | None           | Not Allowed           | `<package name>`.`<source file extension>`     |
| One                         | One                        | One            | Not Allowed           | `<source file name>`.`<source file extension>` |
| One                         | Many                       | One            | Not Allowed           | `<source file name>`.`<source file extension>` |
| One                         | Many                       | None or Many   | Not Allowed           | `<package name>`.zip                           |
| Many                        | N/A                        | Not Allowed    | No                    | pennsieve-data.zip                             |
| Many                        | N/A                        | Not Allowed    | Yes                   | `<archive name>`.zip                           |

Discover Endpoint

| Number of Paths Selected | Number of files in Result | Archive Name Provided | Result                                         |
| :----------------------: | :-----------------------: | :-------------------: | :--------------------------------------------: |
| One                      | One                       | Not Allowed           | `<file name>`.`<file extension>`               |
| One                      | Many                      | Not Allowed           | `<folder name>`.zip                            |
| Many                     | N/A                       | No                    | pennsieve-data.zip                             |
| Many                     | N/A                       | Yes                   | `<archive name>`.zip                           |

#### Duplicate file names

If two files are written to an archive in the same directory, with the same name, the operating system will only unzip
one of them, resulting in the other being lost.  In order to prevent this, the `deduplcateFileName` helper function
adds a number (e.g. `<file name>` (1).`<extension>`) according to how many duplicates have been detected in the state
maintained by `ArchiverHandler`.

It is important to note that, in the case of the pennsieve platform, this approach does not handle certain edge cases,
and the results may be confusing to the client.  Take the following example selection:

- Dataset 1
  - files
    - file.txt
- Dataset 2
  - files
    - file.txt
   
The result will be:

- pennsieve-data
  - files
    - file.txt
    - file (1).txt
    
Whereas a user might _expect_:

- pennsieve-data
  - files
    - file.txt
  - files (1)
    - tile.txt
    
Since the duplication is actually the _files folder_, not the files themselves.  We have explicitly decided not to handle
these edge cases as it would require complex logic in both `pennsieve-api` and `zipit-service`.  At the point in time
of writing this document, the downside of that extra complexity outweighs the upside of handling the edge cases.

# Architecture Notes

This is a node webserver written using [Express](https://expressjs.com).

## Streams

We are motivated to maintain a minimal memory footprint and provide quick responses.

### Pros
*   There are use cases where pennsieve-api might return very large JSON payloads that cannot be loaded all at once without consuming too much memory.  Streams are well suited to solve this problem.
*   We want to begin responding to the client as soon as possible in the case of large download requests.

### Cons
*   Error handling logic is more complex than it might be otherwise.
    *   Errors can occur at different steps of the stream pipeline.  Because emitting errors in streams causes pipelines to fail, we must pass errors along as data in some cases, which feels awkward.
    *   Once we have begun streaming the response, we've already sent HTTP headers and thus CANNOT communicate errors via HTTP status codes.
*   An alternative to streaming JSON may have been to use a more compact serialization format such as [CBOR](https://cbor.io/).


## [Typescript]((https://www.typescriptlang.org/))

### Pros
*   Marketing tagline: "Javascript that scales."  I tend to agree...
*   Helps prevent certain classes of bugs before runtime.  That is good...
*   Enforces a level of self-documenting code that gets more and more useful as projects grow.
*   Because Typescript is a gradual type system that "starts and ends with Javascript"...
    *   When the compiler gets in your way, you can tell it to GO AWAY!
    *   The syntax and semantics are almost identical to JS.
    
### Cons
*   Typescript can introduce additional complexity:
    * Linting, testing, building your project.
    * Incorporating 3rd party libraries.
*   In the end, Javascript is still...Javascript.
    *   There is no type safety at runtime.
    *   There is no type safety at the boundaries of the application.
*   [Yup](https://github.com/jquense/yup) is one measure used to mitigate this problem.
    *   It is very similar to [Joi](https://github.com/hapijs/joi).
    *   It is a bit less opinionated.
    *   It is smaller.
    
## Testing

Integration tests are used to catch regressions.
*   The app starts before the tests run and actual http requests get sent to it.  The tests assert that the actual responses are as expected.
*   Test manifest files, as well as test files for the zip response, are served with the [Test File Server](src/test-file-server/README.md)
    
## Logging

We use [Winston](https://github.com/winstonjs/winston) for logging.

*   JSON formatted logs to `stdout`, easily complies with Pennsieve logging standards.
*   **Levels**: recommend that Error, Warn, and Info trigger actionable alarms.
    *   Error: An unexpected, critical situation.  Use only if you are claiming that the sky is falling (e.g the server stopped or failed to start).
    *   Warn: An unexpected situation has occurred that should be looked into.
    *   Info: Something unusual has happened.  The system is stable but you might want to see if users are complaining.
    *   Verbose:  Informational message regarding the status of the service.
    *   Debug: Informational message during processing.
    *   Silly:  Self explanatory...usually for development purposes only.
  

## [Eslint](.eslintrc.js)
*   Extend well-known recommended rule sets to align with community standards.
*   [Prettier](https://prettier.io/) formatting standards...not because I like them, but because I don't want to waste time and energy discussing style.
*   Requiring JSDOC comments for public (exported) functions/classes:
    *   Describe exported members to tell me **why** things exist.
    *   Do not require `@param` and `@return` tags, as typescript takes care of much of this mental overhead.
 
## Build

We build the project using [Webpack](webpack.config.js).

### Pros
*   Creates a single executable, including all dependencies.
*   Provides dead code elimination ("tree shaking") to minimize the size of the bundle.
*   Obfuscates delivered code, providing an incremental security benefit.

### Cons
*   Perhaps overkill for this project.
*   An alternative would be to simply compile the typescript to javasript, and include the `node_modules` folder with the distribution. 

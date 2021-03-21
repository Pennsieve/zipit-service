FROM node:12-alpine as builder

WORKDIR /service/zipit

COPY package.json package.json
COPY package-lock.json package-lock.json
COPY tsconfig.json tsconfig.json
COPY tsconfig.build.json tsconfig.build.json
COPY webpack.config.js webpack.config.js
COPY jest.config.js jest.config.js
COPY src src

ARG test=false

RUN npm i
RUN if [ "$test" == "false" ] ; then npm run build ; fi

FROM pennsieve/node-cloudwrap:12-0.5.9 as service

WORKDIR /service/zipit
COPY --chown=pennsieve:pennsieve --from=builder /service/zipit .
CMD ["--service", "zipit-service", "exec", "node", "dist/bundle.js"]

ARG IMAGE=node
ARG IMAGE_TAG=16.17

##
## Dev dependencies
##
FROM ${IMAGE}:${IMAGE_TAG} AS dev-dependencies

WORKDIR /opt/app

COPY app/package.json app/package-lock.json ./

RUN npm ci --ignore-scripts

##
## Prod dependencies
##
FROM ${IMAGE}:${IMAGE_TAG} AS prod-dependencies

WORKDIR /opt/app

COPY app/package.json app/package-lock.json ./

RUN npm ci --ignore-scripts --omit=dev


##
## Build
##
FROM ${IMAGE}:${IMAGE_TAG} AS build

WORKDIR /opt/app

COPY app ./
COPY --from=dev-dependencies \
     /opt/app/node_modules ./node_modules

RUN npm run compile --ignore-scripts


##
## Runtime
##
FROM ${IMAGE}:${IMAGE_TAG}-bullseye-slim AS runtime

##
## Set environment variables
##
ENV NODE_ENV production
ENV NODE_CONFIG_STRICT_MODE false
ENV VERSION ""
ENV LOG_LEVEL trace
ENV DD_VERSION ${VERSION}

WORKDIR /opt/app

##
## Install dependencies
##
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init
COPY --chown=node:node \
     --from=prod-dependencies \
     /opt/app/node_modules ./node_modules

##
## Copy over transpiled project files
##
COPY --chown=node:node \
     --from=build \
     /opt/app/dist ./
COPY --chown=node:node \
     app/config ./config

##
## Set the user - do not run container as root!
##
USER node

ENTRYPOINT [ "/usr/bin/dumb-init", "--" ]
CMD [ "/usr/local/bin/node", "index.js" ]

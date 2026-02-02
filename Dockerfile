# syntax=docker/dockerfile:1.7

# Build stage (includes native build tooling for bcrypt)
FROM node:20-bookworm AS build

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
COPY assets ./assets
COPY uploads ./uploads

RUN npm run build \
  && npm prune --omit=dev


# Runtime stage
FROM node:20-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=build --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/assets ./assets
COPY --from=build --chown=node:node /app/uploads ./uploads

USER node

EXPOSE 4000

# tsconfig outputs to dist/src/* due to rootDir "."
CMD ["node", "dist/src/index.js"]

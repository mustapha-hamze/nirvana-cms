# syntax=docker/dockerfile:1
#
# Built with the repo root as context (see docker-compose.yml's
# `build.context: .` / `build.dockerfile: server/Dockerfile`), so COPY paths
# below are relative to the repo root, not this file's directory.

# ---- deps: install ALL dependencies (incl. dev — tsc is needed to build) ----
FROM oven/bun:1 AS deps
WORKDIR /app
COPY server/package.json server/bun.lock ./
RUN bun install --frozen-lockfile

# ---- build: compile TypeScript (src -> dist) ----
FROM oven/bun:1 AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY server/ ./
RUN bun run build

# ---- script-runner: one-off admin scripts (server/scripts/*.ts) ----
# Genuine Node, not Bun, for two separate reasons that both bit when this was
# first tried on the `build` stage above: (1) oven/bun's own "node" binary is
# actually Bun in disguise (no real Node.js exists in that image — see
# /usr/local/bun-node-fallback-bin/node), which breaks tsx's Node-loader-
# dependent bootstrap outright; (2) running these scripts under Bun's own
# runtime instead (bypassing tsx) hits the exact same bson/
# v8.startupSnapshot crash documented on the `runner` stage below, since
# these scripts import Mongoose too. Real Node hits neither problem. Reuses
# `deps`'s already-installed node_modules rather than a second install —
# safe because node:22-slim shares the same Debian/glibc base as oven/bun:1,
# so no native-binary mismatch (this stage doesn't need sharp anyway, but
# staying consistent with the `runner` stage's reasoning below).
FROM node:22-slim AS script-runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY server/ ./

# ---- prod-deps: production-only dependencies for the runtime image ----
FROM oven/bun:1 AS prod-deps
WORKDIR /app
COPY server/package.json server/bun.lock ./
RUN bun install --frozen-lockfile --production

# ---- runner: plain Node — Bun is only ever used above to install/build ----
# Stays on a Debian base (like oven/bun:1 above), not Alpine: sharp's
# prebuilt native binary is selected at install time for the installing
# image's libc, and prod-deps just installed it under glibc. Swapping this
# stage to an Alpine (musl) image would make that binary fail to load here.
FROM node:22-slim AS runner
ENV NODE_ENV=production
WORKDIR /app

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs appuser

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# "type": "module" here is load-bearing, not decorative — dist/*.js is
# compiled ESM (import/export), and without this field Node treats .js as
# CommonJS and refuses to run it.
COPY server/package.json ./

RUN mkdir -p storage && chown -R appuser:nodejs /app
USER appuser

EXPOSE 5001
VOLUME ["/app/storage"]

CMD ["node", "dist/index.js"]

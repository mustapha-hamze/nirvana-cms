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

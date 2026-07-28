# syntax=docker/dockerfile:1
#
# Built with the repo root as context (see docker-compose.yml's
# `build.context: .` / `build.dockerfile: client/Dockerfile`), so COPY paths
# below are relative to the repo root, not this file's directory.

# ---- deps: install dependencies with Bun ----
FROM oven/bun:1 AS deps
WORKDIR /app
COPY client/package.json client/bun.lock ./
RUN bun install --frozen-lockfile

# ---- build: Vite production build ----
# No VITE_* build-time env vars are needed — the app only ever calls
# relative /api and /storage paths (see src/api/client.ts, src/utils/
# mediaUrl.ts), which nginx below reverse-proxies to the server container.
FROM oven/bun:1 AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY client/ ./
RUN bun run build

# ---- runner: static files served by nginx ----
FROM nginx:1.27-alpine AS runner
COPY --from=build /app/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

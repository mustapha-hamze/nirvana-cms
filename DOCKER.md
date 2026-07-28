# Docker

Local/single-VPS deployment via Docker Compose. Three services: `client` (nginx serving the
built Vite app, reverse-proxying API/storage requests), `server` (the Express API, run with
plain Node — see "Why the server runs on Node" below), and `mongo`.

## Setup

1. Copy the env file and fill in real values:

   ```bash
   cp .env.example .env
   ```

   At minimum, change `JWT_SECRET`, `MONGO_ROOT_PASSWORD`, and keep `MONGO_URI`'s credentials
   in sync with `MONGO_ROOT_USERNAME`/`MONGO_ROOT_PASSWORD`/`MONGO_DATABASE` if you change them.
   Set `CORS_ORIGIN` to wherever the client will actually be reached from a browser (e.g.
   `http://your-vps-ip` or `https://your-domain`) — the server refuses to start without it
   when `NODE_ENV=production`.

2. Build and start everything:

   ```bash
   docker compose build
   docker compose up -d
   ```

3. Check it's up:

   ```bash
   curl http://localhost/api/health
   # {"status":"ok"}
   ```

4. Tear down:

   ```bash
   docker compose down
   ```

   (Add `-v` only if you actually want to delete the Mongo data / uploads volumes too — it's
   not part of the normal stop/start cycle.)

## Ports

Only **port 80** (the `client` service, nginx) is published to the host. `server` and `mongo`
are reachable only from other containers on the internal `nirvana-net` network — neither is
bound to a host port, so nothing on the VPS can reach Mongo on 27017 or the API on 5001
directly. All `/api/*` and `/storage/*` requests go through nginx on port 80, which
reverse-proxies them to `server:5001` inside the network.

## Where data persists

- **MongoDB data** — named volume `mongo-data`, mounted at `/data/db` in the `mongo` container.
- **Uploaded files** (images/videos/documents) — named volume `server-storage`, mounted at
  `/app/storage` in the `server` container (matches `server/src/utils/imageStorage.ts` and
  `rawFileUpload.ts`'s path resolution). The app creates its own subfolders on first upload,
  so the volume can start empty.

Both survive `docker compose down` and container rebuilds; they're only removed if you run
`docker compose down -v` or `docker volume rm` explicitly.

## Creating the first SuperAdmin

There's no signup flow — the app is unusable until at least one SuperAdmin exists. Set
`INIT_SUPER_ADMIN_EMAIL`/`INIT_SUPER_ADMIN_PASSWORD` in `.env` (see `.env.example`), make sure
`mongo` is up, then run:

```bash
docker compose run --rm server-init npx tsx scripts/ensureSuperAdmin.ts
```

This only ever *creates* — if a user with that email already exists, it prints a message and
exits without touching anything. Safe to re-run after every deploy or migration.

`server-init` is a separate, `profiles: [tools]`-gated service (see `docker-compose.yml`) so
it never starts with a plain `docker compose up` — it exists only to run one-off scripts like
this one. It's *not* built from `server`'s own image (that final image is intentionally
Node-only with production dependencies and no `scripts/` source, so it can't run a `.ts` file
at all) and it's deliberately *not* the Bun-based `build` stage either — both `tsx` and Bun's
own runtime fail inside a Bun-only container here (see `server/Dockerfile`'s `script-runner`
stage comment for the two separate reasons why). `server-init` targets `script-runner`
instead: genuine Node + `tsx` + the full source, built once from the same Dockerfile.

To run any other one-off script under `scripts/` (e.g. an existing migration script) the same
way, swap the file name:

```bash
docker compose run --rm server-init npx tsx scripts/<name>.ts
```

## Why the server runs on Node, not Bun

Bun is used to **install dependencies and build** the server (`bun install`, `bun run build`
inside `server/Dockerfile`), but the final image's `CMD` is `node dist/index.js`, and the
runtime base image is `node:22-slim` — no Bun binary present at all. This isn't a style
choice: Mongoose's `bson` dependency currently crashes on startup under Bun's runtime (see
`server/package.json`'s `engines` and `TECH_STACK.md` for the tracked upstream issue), so
production still needs Node to actually run the app.

## Verifying a full rebuild

```bash
docker compose config      # validate + see the fully-resolved compose file
docker compose build       # build client + server images
docker compose up -d       # start mongo, server, client
curl http://localhost/api/health
docker compose run --rm server-init npx tsx scripts/ensureSuperAdmin.ts
docker compose logs        # check all three services came up cleanly
docker compose down
```

See `MIGRATION.md` if you're bringing existing data in from a native (non-Docker) MongoDB
first — do that *before* running the SuperAdmin script above, so it checks against your real,
restored data instead of an empty database.

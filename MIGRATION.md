# Migrating native MongoDB data into Docker

If you were previously running the server natively against a local `mongod` (not Docker), use
this to bring that data into the Docker `mongo` service's volume. Every command below was
run and verified against a real Docker mongo container while writing this doc.

## What gets migrated

The app uses one MongoDB database (`nirvana-cms` by default — matches `MONGO_URI`'s path in
both `server/.env.example` and the root `.env.example`) holding these collections, one per
Mongoose model under `server/src/models/`:

- `applications`, `applicationsettings` — apps/websites + their settings
- `pages`, `pagedetails` — pages and their per-language content (sections/components/elements
  live embedded inside `pagedetails` documents, not as a separate collection)
- `contents`, `contentdetails` — content articles, same per-language split
- `categories`, `tags`
- `users`

`mongodump`/`mongorestore` operate on the whole database, not a hand-picked collection list —
so you don't need to enumerate these yourself, and anything else that happens to exist in your
native database (old/unused collections included) comes along automatically too.

## Prerequisites

- `mongodump`/`mongorestore` on your Mac — these are the MongoDB Database Tools, not bundled
  with `mongod` itself:
  ```bash
  brew install mongodb-database-tools   # if `which mongodump` comes back empty
  ```
- `.env` set up per `DOCKER.md` (real `MONGO_ROOT_USERNAME`/`MONGO_ROOT_PASSWORD`/
  `MONGO_DATABASE`), but the full stack does **not** need to be running yet — steps 3–6 below
  only need the `mongo` container.

## Steps

### 1. Stop native app writes

If the server/client are running natively (`bun run dev`, etc.), stop them — a dump taken
while something is still writing isn't a consistent snapshot.

### 2. Dump the native database

```bash
mongodump --uri="mongodb://localhost:27017/nirvana-cms" --out=./mongo-dump
```

Produces `./mongo-dump/nirvana-cms/` — one `.bson` + `.metadata.json` pair per collection.
Adjust the database name in the URI if your native setup uses a different one.

### 3. Start just the Docker MongoDB container

```bash
docker compose up -d mongo
docker compose ps mongo   # wait for "healthy"
```

### 4. Copy the dump into the mongo container

The `mongo` service has no host-published port (see `DOCKER.md`), so `mongorestore` can't
reach it directly from the Mac's network — `docker cp` the dump files in instead, then run
`mongorestore` from inside the container.

```bash
docker cp ./mongo-dump/nirvana-cms nirvana-cms-mongo-1:/tmp/nirvana-cms-dump
```

### 5. Restore inside the container

```bash
docker compose exec mongo sh -c '
  mongorestore \
    --username "$MONGO_INITDB_ROOT_USERNAME" \
    --password "$MONGO_INITDB_ROOT_PASSWORD" \
    --authenticationDatabase admin \
    --db nirvana-cms \
    /tmp/nirvana-cms-dump
'
```

This authenticates using the root credentials already set as env vars on the `mongo`
container itself (from your `.env`) — you never type the real password into this command.
You'll see a one-line deprecation notice about `--db`/`--collection` (mongorestore now prefers
`--nsInclude`) — harmless, the restore still completes correctly.

> **`--drop` warning:** the command above is *additive* — it inserts into whatever's already
> in the Docker volume's `nirvana-cms` database. If the Docker volume already has data you
> don't need (e.g. from earlier testing) and you want a byte-for-byte clean import instead,
> add `--drop` right before the path argument. **`--drop` deletes every collection in the
> target database that also exists in the dump, before restoring it** — only use it if you're
> certain there's nothing in the Docker volume worth keeping.

### 6. Initialize the SuperAdmin

Run this *after* restoring, not before — it checks against your real, now-restored `users`
collection, not an empty one (see `DOCKER.md` for what this script does):

```bash
docker compose run --rm server-init npx tsx scripts/ensureSuperAdmin.ts
```

It only ever creates — if your native data already has a SuperAdmin under a different email
than `INIT_SUPER_ADMIN_EMAIL`, this adds a *second* one rather than replacing it. Both work;
delete whichever you don't want afterward via the admin panel.

### 7. Start the full stack

```bash
docker compose up -d
curl http://localhost/api/health
```

### 8. Verify

```bash
docker compose exec mongo sh -c '
  mongosh --quiet --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --eval "
    const db = db.getSiblingDB(\"nirvana-cms\");
    db.getCollectionNames().forEach(function(c) { print(c + \": \" + db.getCollection(c).countDocuments({})); });
  "
'
```

Compare the counts against what your native database had before the dump. Then log into the
admin panel at `http://localhost` and confirm your real applications/pages actually render.

## Uploaded files are separate from MongoDB

Images/videos/documents live on disk, not in Mongo — natively under `server/storage/`, or the
`server-storage` Docker volume in Compose. Nothing above touches them. If you have real
uploaded files to bring over:

```bash
docker compose up -d server   # needs the server container to exist first
docker cp ./server/storage/. nirvana-cms-server-1:/app/storage/
```

## Backing up the Docker database later

Same idea, reversed — dump inside the container, copy the dump out:

```bash
# Backup
docker compose exec mongo sh -c '
  mongodump --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" \
    --authenticationDatabase admin --db nirvana-cms --out=/tmp/backup
'
docker cp nirvana-cms-mongo-1:/tmp/backup ./mongo-backup-$(date +%Y%m%d)

# Restore from that backup later (same --drop caveat as step 5 applies)
docker cp ./mongo-backup-20260101/nirvana-cms nirvana-cms-mongo-1:/tmp/restore
docker compose exec mongo sh -c '
  mongorestore --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" \
    --authenticationDatabase admin --db nirvana-cms /tmp/restore
'
```

Back up `server-storage` uploads too — a Mongo dump alone doesn't include them:

```bash
docker cp nirvana-cms-server-1:/app/storage ./storage-backup-$(date +%Y%m%d)
```

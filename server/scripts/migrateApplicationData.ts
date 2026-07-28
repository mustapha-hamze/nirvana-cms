// Copies one application and everything scoped to it — settings, pages,
// page details (sections/components/elements live embedded inside those),
// contents, content details, categories, tags, and any staff users assigned
// to it — from a source MongoDB into this project's destination MongoDB
// (MONGO_URI). Built for moving one app's real data from a native/local
// MongoDB into the Docker `mongo` service without dumping the whole
// database (see MIGRATION.md for that full-database alternative).
//
// Uses the raw MongoDB driver (via mongoose.createConnection(), not the App
// models) deliberately, same reasoning as
// scripts/migratePageSectionsToComponents.ts: this needs two *separate*,
// simultaneously-open connections (source + destination), which the
// Mongoose models (bound to one global default connection) can't do, and a
// raw document copy avoids any risk of the schema silently reinterpreting
// or dropping fields on read.
//
// Idempotent: a document already present in the destination (matched by its
// original _id, preserved as-is across both databases) is left untouched,
// never overwritten — safe to re-run after adding more pages/content to the
// same source application later.
//
// Run via:
//   tsx scripts/migrateApplicationData.ts   (or: npx tsx scripts/migrateApplicationData.ts)
//
// Inside Docker (see DOCKER.md's server-init service), MIGRATE_SOURCE_MONGO_URI
// must use host.docker.internal, not localhost — "localhost" inside a
// container is the container itself, not the Mac running native mongod:
//   docker compose run --rm server-init npx tsx scripts/migrateApplicationData.ts
import 'dotenv/config'
import mongoose from 'mongoose'
import type { Db, Document } from 'mongodb'

const SOURCE_URI = process.env.MIGRATE_SOURCE_MONGO_URI
const APPLICATION_NAME = process.env.MIGRATE_APPLICATION_NAME
const DEST_URI = process.env.MONGO_URI

if (!SOURCE_URI || !APPLICATION_NAME || !DEST_URI) {
  throw new Error(
    'MIGRATE_SOURCE_MONGO_URI, MIGRATE_APPLICATION_NAME, and MONGO_URI must all be set in the environment',
  )
}

// Collections that carry a direct `application` field (see
// models/**/*.ts — Page, PageDetails, Content, ContentDetails, Category,
// Tag, ApplicationSetting all require one). `pagedetails`/`contentdetails`
// also denormalize `application` from their parent specifically so this
// kind of per-application query doesn't need a join.
const APPLICATION_SCOPED_COLLECTIONS = [
  'applicationsettings',
  'pages',
  'pagedetails',
  'contents',
  'contentdetails',
  'categories',
  'tags',
]

async function copyCollection(
  sourceDb: Db,
  destDb: Db,
  name: string,
  filter: Record<string, unknown>,
) {
  const docs = await sourceDb.collection(name).find(filter).toArray()
  let inserted = 0
  let skipped = 0
  let failed = 0

  for (const doc of docs) {
    const exists = await destDb.collection(name).findOne({ _id: doc._id }, { projection: { _id: 1 } })
    if (exists) {
      skipped++
      continue
    }
    try {
      await destDb.collection(name).insertOne(doc as Document)
      inserted++
    } catch (err) {
      // One bad document (e.g. a unique-index conflict with unrelated
      // existing data) shouldn't abort the whole migration — report it and
      // keep going so everything else still gets copied.
      failed++
      console.error(`  ! failed to insert ${name}/${doc._id}:`, (err as Error).message)
    }
  }

  console.log(
    `${name}: ${inserted} inserted, ${skipped} already present, ${failed} failed (${docs.length} found in source)`,
  )
}

async function main() {
  const sourceConn = await mongoose.createConnection(SOURCE_URI!).asPromise()
  const destConn = await mongoose.createConnection(DEST_URI!).asPromise()
  const sourceDb = sourceConn.db!
  const destDb = destConn.db!

  try {
    const app = await sourceDb.collection('applications').findOne({ name: APPLICATION_NAME })
    if (!app) {
      throw new Error(`No application named "${APPLICATION_NAME}" found in the source database`)
    }

    console.log(`Migrating application "${app.name}" (${app._id}) ...`)

    await copyCollection(sourceDb, destDb, 'applications', { _id: app._id })

    for (const name of APPLICATION_SCOPED_COLLECTIONS) {
      await copyCollection(sourceDb, destDb, name, { application: app._id })
    }

    // Staff assigned to this app (WebSiteAdmin/WebSiteContentCreator/
    // WebsiteUser — see constants/roles.ts's APP_SCOPED_ROLES). `applications`
    // is an array field, so this matches any user whose array contains
    // app._id. SuperAdmin accounts have applications: [] and are
    // intentionally out of scope here — see scripts/ensureSuperAdmin.ts.
    await copyCollection(sourceDb, destDb, 'users', { applications: app._id })

    console.log('Done.')
  } finally {
    await sourceConn.close()
    await destConn.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})

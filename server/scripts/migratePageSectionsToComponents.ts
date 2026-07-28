// One-off migration: sections used to carry their own `type` + `elements`
// directly; sections are now generic containers holding a `components` array
// (see models/page/Section.js), where each component is the old
// `{type, elements}` shape. This rewrites every PageDetails document's
// sections from the old shape to the new one in place.
//
// Uses the raw MongoDB driver (not the Mongoose model) deliberately: the
// Section schema on this branch only recognizes the NEW shape, so reading old
// documents through the Mongoose model would silently strip `type`/`elements`
// (unknown paths) and cast them into empty, title-less, component-less
// sections — quietly losing every old page's content. Going around the ODM
// avoids that entirely.
//
// Run once, after deploying this schema change:
//   npx tsx scripts/migratePageSectionsToComponents.ts
import 'dotenv/config'
import mongoose from 'mongoose'

function isOldShapeSection(section: any) {
  // New-shape sections have `components`; old-shape ones have `type` at the
  // section's own level. A section already migrated (or freshly created)
  // won't have `type`, so this is idempotent — safe to re-run.
  return section && typeof section === 'object' && 'type' in section && !('components' in section)
}

function migrateSection(section: any) {
  if (!isOldShapeSection(section)) return section
  const { type, elements, ...rest } = section
  return {
    ...rest,
    title: rest.title || '',
    components: [{ type, elements: elements ?? [] }],
  }
}

async function main() {
  const uri = process.env.MONGO_URI
  if (!uri) throw new Error('MONGO_URI is not set in the environment')

  await mongoose.connect(uri)
  const collection = mongoose.connection.db!.collection('pagedetails')

  const cursor = collection.find({ sections: { $exists: true, $ne: [] } })
  let scanned = 0
  let migrated = 0

  for await (const doc of cursor) {
    scanned++
    if (!Array.isArray(doc.sections) || !doc.sections.some(isOldShapeSection)) continue

    const nextSections = doc.sections.map(migrateSection)
    await collection.updateOne({ _id: doc._id }, { $set: { sections: nextSections } })
    migrated++
  }

  console.log(`Scanned ${scanned} page detail document(s), migrated ${migrated}.`)
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

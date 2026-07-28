// Idempotent first-boot setup: the app is unusable until at least one
// SuperAdmin exists (there's no public signup), so this creates one from
// env vars if none exists yet. Safe to run on every deploy/startup — it
// only ever creates, never mutates an existing user with the same email.
//
// Run via:
//   bun run init:super-admin        (or: npx tsx scripts/ensureSuperAdmin.ts)
//
// See DOCKER.md for running this inside the Docker Mongo network.
import 'dotenv/config'
import { connectDB } from '../src/config/db.js'
import mongoose from 'mongoose'
import User from '../src/models/User.js'
import { ROLES } from '../src/constants/roles.js'

const EMAIL = process.env.INIT_SUPER_ADMIN_EMAIL?.trim().toLowerCase()
const PASSWORD = process.env.INIT_SUPER_ADMIN_PASSWORD
// Optional — cosmetic only (User.name), defaults if unset.
const NAME = process.env.INIT_SUPER_ADMIN_NAME?.trim() || 'Super Admin'

if (!EMAIL || !PASSWORD) {
  throw new Error(
    'INIT_SUPER_ADMIN_EMAIL and INIT_SUPER_ADMIN_PASSWORD must both be set in the environment',
  )
}

async function main() {
  await connectDB()

  // isDeleted: {$in:[true,false]} matches regardless of soft-delete status
  // (see softDeletePlugin — it only auto-scopes to non-deleted when the
  // caller's filter doesn't already mention isDeleted). Without this, a
  // soft-deleted user with this email would be invisible to a plain
  // findOne, and User.create below would then fail on email's unique index
  // instead of being detected here.
  const existing = await User.findOne({ email: EMAIL, isDeleted: { $in: [true, false] } }).select(
    '_id role isDeleted',
  )
  if (existing) {
    // Never touch an existing user's password/role here — this script only
    // ever creates the first SuperAdmin, it doesn't reconcile/reset one.
    const note = existing.isDeleted ? ', soft-deleted — won\'t be able to log in as-is' : ''
    console.log(`User ${EMAIL} already exists (role: ${existing.role}${note}) — nothing to do.`)
    return
  }

  // Password is intentionally passed as plaintext: User's passwordHashPlugin
  // hashes it in a pre('save') hook, same as every other place a User gets
  // created (see scripts/e2eSeed.ts, controllers/userController.ts).
  const user = await User.create({
    email: EMAIL,
    password: PASSWORD,
    name: NAME,
    role: ROLES.SUPER_ADMIN,
    applications: [],
  })

  console.log(`Created SuperAdmin ${user.email} (id: ${user._id}).`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })

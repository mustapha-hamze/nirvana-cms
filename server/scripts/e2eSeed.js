// Run by e2e/global-setup.ts (via a child process, not an import) so this
// script's own `import mongoose ...` resolves against server/node_modules —
// the same Mongoose instance server/src/models/*.js resolve against. If the
// driving process lived outside server/ and imported these models directly,
// it would pull a second, disconnected Mongoose singleton in from its own
// node_modules and every write would hang waiting on a connection that was
// never opened on *that* instance.
import mongoose from 'mongoose'
import User from '../src/models/User.js'
import Application from '../src/models/application/Application.js'
import { ROLES } from '../src/constants/roles.js'

const MONGO_URI = process.env.MONGO_URI
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD

if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error('MONGO_URI, E2E_ADMIN_EMAIL, and E2E_ADMIN_PASSWORD must be set')
}

await mongoose.connect(MONGO_URI)
// Clean slate for every run rather than accumulating leftover state.
await mongoose.connection.dropDatabase()

const application = await Application.create({
  name: 'E2E Test App',
  appKey: 'e2e-test-app',
  status: 'active',
})

await User.create({
  email: ADMIN_EMAIL,
  password: ADMIN_PASSWORD,
  name: 'E2E Admin',
  role: ROLES.SUPER_ADMIN,
  applications: [],
})

await mongoose.disconnect()

// global-setup.ts reads the last stdout line as JSON — keep this the only
// thing printed on it.
console.log(JSON.stringify({ applicationId: application._id.toString() }))

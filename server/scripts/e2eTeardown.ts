// Run by e2e/global-teardown.ts as a child process — see e2eSeed.ts for why
// this lives inside server/ rather than being imported from e2e/.
import mongoose from 'mongoose'

const MONGO_URI = process.env.MONGO_URI
if (!MONGO_URI) {
  throw new Error('MONGO_URI must be set')
}

await mongoose.connect(MONGO_URI)
await mongoose.connection.dropDatabase()
await mongoose.disconnect()

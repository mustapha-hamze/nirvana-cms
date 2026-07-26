import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { SERVER_DIR, MONGO_URI } from './env'

export default async function globalTeardown() {
  execFileSync('node', [path.join(SERVER_DIR, 'scripts', 'e2eTeardown.js')], {
    cwd: SERVER_DIR,
    env: { ...process.env, MONGO_URI },
    stdio: 'inherit',
  })
}

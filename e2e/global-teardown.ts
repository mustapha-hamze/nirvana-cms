import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { SERVER_DIR, MONGO_URI } from './env'

// Run through server/'s local tsx binary — see global-setup.ts's seedDatabase
// comment for why the .ts script can't be run with plain node.
const TSX_BIN = path.join(SERVER_DIR, 'node_modules', '.bin', 'tsx')

export default async function globalTeardown() {
  execFileSync(TSX_BIN, [path.join('scripts', 'e2eTeardown.ts')], {
    cwd: SERVER_DIR,
    env: { ...process.env, MONGO_URI },
    stdio: 'inherit',
  })
}

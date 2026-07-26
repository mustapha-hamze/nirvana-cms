import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const REPO_ROOT = path.resolve(__dirname, '..')
export const SERVER_DIR = path.join(REPO_ROOT, 'server')

export const SERVER_PORT = 5057
export const CLIENT_PORT = 4177
export const SERVER_URL = `http://127.0.0.1:${SERVER_PORT}`
export const CLIENT_URL = `http://127.0.0.1:${CLIENT_PORT}`

// Isolated from the dev database (nirvana-cms) — same local Mongo instance,
// separate database name, dropped and reseeded on every run.
export const MONGO_URI = 'mongodb://127.0.0.1:27017/nirvana-cms-e2e'
export const JWT_SECRET = 'e2e-test-jwt-secret-not-for-production'
export const JWT_EXPIRES_IN = '1h'

export const ADMIN_EMAIL = 'e2e-admin@nirvana-cms.test'
export const ADMIN_PASSWORD = 'E2eAdmin!2026'

export const STORAGE_STATE_PATH = path.join(__dirname, '.auth', 'admin.json')

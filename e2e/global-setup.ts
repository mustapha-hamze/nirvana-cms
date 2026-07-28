import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'
import {
  SERVER_DIR,
  MONGO_URI,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  CREATOR_EMAIL,
  CREATOR_PASSWORD,
  CLIENT_URL,
  STORAGE_STATE_PATH,
} from './env'

// Seeds the e2e database directly (bypassing the API — there's no
// bootstrap-the-first-admin endpoint, same as a real deployment) by shelling
// out to a script inside server/ rather than importing its models here. See
// server/scripts/e2eSeed.ts for why that boundary matters.
//
// The script is TypeScript, so it's run through server/'s local tsx binary
// (server/'s ESM + NodeNext resolution needs tsx's loader, not plain node).
const TSX_BIN = path.join(SERVER_DIR, 'node_modules', '.bin', 'tsx')

function seedDatabase(): string {
  const output = execFileSync(TSX_BIN, [path.join('scripts', 'e2eSeed.ts')], {
    cwd: SERVER_DIR,
    env: {
      ...process.env,
      MONGO_URI,
      E2E_ADMIN_EMAIL: ADMIN_EMAIL,
      E2E_ADMIN_PASSWORD: ADMIN_PASSWORD,
      E2E_CREATOR_EMAIL: CREATOR_EMAIL,
      E2E_CREATOR_PASSWORD: CREATOR_PASSWORD,
    },
    encoding: 'utf-8',
  })
  const lastLine = output.trim().split('\n').filter(Boolean).pop()
  const { applicationId } = JSON.parse(lastLine ?? '{}')
  if (!applicationId) throw new Error(`e2eSeed.ts did not report an applicationId. Output:\n${output}`)
  return applicationId
}

// Logs in for real through the UI (exercising the actual client+server login
// flow once) and saves the resulting session so every test starts already
// authenticated, instead of re-running the login flow per test.
async function saveAuthenticatedState() {
  fs.mkdirSync(path.dirname(STORAGE_STATE_PATH), { recursive: true })

  // channel: 'chrome' matches playwright.config.ts's project — reuses the
  // system-installed Chrome instead of requiring a separate browser download.
  const browser = await chromium.launch({ channel: 'chrome' })
  const page = await browser.newPage({ baseURL: CLIENT_URL })
  await page.goto('/login')
  await page.getByLabel('Email address').fill(ADMIN_EMAIL)
  await page.getByLabel('Password').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('**/applications')
  await page.context().storageState({ path: STORAGE_STATE_PATH })
  await browser.close()
}

export default async function globalSetup() {
  const applicationId = seedDatabase()
  // Read back by test files — env vars set here are inherited by the worker
  // processes Playwright spawns for the actual test run.
  process.env.E2E_APPLICATION_ID = applicationId

  await saveAuthenticatedState()
}

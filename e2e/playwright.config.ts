import { defineConfig, devices } from '@playwright/test'
import {
  REPO_ROOT,
  SERVER_PORT,
  CLIENT_PORT,
  SERVER_URL,
  CLIENT_URL,
  MONGO_URI,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  STORAGE_STATE_PATH,
} from './env'

export default defineConfig({
  testDir: './tests',
  // Defaults to <cwd>/test-results, which would land at the repo root since
  // this suite is run via `npm run test:e2e` from there — keep it scoped
  // under e2e/ instead, matching /e2e/.auth and the .gitignore entries.
  outputDir: './test-results',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  reporter: 'list',
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
  use: {
    baseURL: CLIENT_URL,
    storageState: STORAGE_STATE_PATH,
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'npm run build --prefix server && npm run start --prefix server',
      cwd: REPO_ROOT,
      url: `${SERVER_URL}/api/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      env: {
        PORT: String(SERVER_PORT),
        MONGO_URI,
        JWT_SECRET,
        JWT_EXPIRES_IN,
      },
    },
    {
      command: `bun --cwd=client run build && bun --cwd=client run preview -- --host 127.0.0.1 --port ${CLIENT_PORT}`,
      cwd: REPO_ROOT,
      url: CLIENT_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        API_PROXY_TARGET: SERVER_URL,
      },
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
})

import { defineConfig, devices } from "@playwright/test";
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
  JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN,
} from "./env";

export default defineConfig({
  testDir: "./tests",
  // Defaults to <cwd>/test-results, which would land at the repo root since
  // this suite is run via `npm run test:e2e` from there — keep it scoped
  // under e2e/ instead, matching /e2e/.auth and the .gitignore entries.
  outputDir: "./test-results",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  reporter: "list",
  globalSetup: "./global-setup.ts",
  globalTeardown: "./global-teardown.ts",
  use: {
    baseURL: CLIENT_URL,
    storageState: STORAGE_STATE_PATH,
    trace: "on-first-retry",
  },
  // Both entries below start in parallel, and each `build && start`/`preview`
  // command does a real tsc/vite build before its server comes up — on a
  // shared, low-core CI runner the two builds contend for CPU with each
  // other (plus Chrome/Mongo already running), so build time alone can push
  // past a timeout that's comfortably generous when run locally/uncontended.
  // These timeouts carry that CI-contention margin, not just local build time.
  webServer: [
    {
      command: "npm run build --prefix server && npm run start --prefix server",
      cwd: REPO_ROOT,
      url: `${SERVER_URL}/api/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 90_000,
      env: {
        PORT: String(SERVER_PORT),
        MONGO_URI,
        JWT_SECRET,
        JWT_EXPIRES_IN,
        JWT_REFRESH_SECRET,
        JWT_REFRESH_EXPIRES_IN,
      },
    },
    {
      command: `bun --cwd=client run build && bun --cwd=client run preview -- --host 127.0.0.1 --port ${CLIENT_PORT}`,
      cwd: REPO_ROOT,
      url: CLIENT_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 240_000,
      env: {
        API_PROXY_TARGET: SERVER_URL,
      },
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
});

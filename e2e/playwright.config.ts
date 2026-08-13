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
  // Both entries below start in parallel. Building both apps *inside* the
  // webServer command used to mean two real tsc/vite builds contending for
  // CPU on a shared, low-core CI runner (plus Chrome/Mongo already running),
  // which could push build time alone past even a generous timeout. In CI,
  // ci.yml's e2e job now builds both apps as explicit prior steps (full CPU
  // each, no contention) — here the command just starts the already-built
  // artifacts, so these timeouts are headroom, not a contention budget.
  // Locally there's no prebuild step, so the command still builds inline —
  // `npm run test:e2e` keeps working standalone without extra setup.
  webServer: [
    {
      command: process.env.CI
        ? "npm run start --prefix server"
        : "npm run build --prefix server && npm run start --prefix server",
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
      command: process.env.CI
        ? `bun --cwd=client run preview -- --host 127.0.0.1 --port ${CLIENT_PORT}`
        : `bun --cwd=client run build && bun --cwd=client run preview -- --host 127.0.0.1 --port ${CLIENT_PORT}`,
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

import { request as pwRequest, type Page } from '@playwright/test'
import { SERVER_URL, ADMIN_EMAIL, ADMIN_PASSWORD } from '../env'

// Shared RBAC-test helpers. Role-specific accounts (beyond the seeded SuperAdmin
// and WebSiteContentCreator) are created through the real admin API rather than
// by growing the seed script — a fresh account per spec keeps these tests
// self-contained and order-independent, and the isolated e2e DB is dropped at
// teardown anyway.

export type CreatedUser = {
  _id: string
  email: string // stored email (WebsiteUser is "[appId]-[rawEmail]")
  displayEmail: string
  role: string
}

// Creates a user via POST /api/users as the seeded SuperAdmin. `applicationId`
// is required for app-scoped roles (WebSiteAdmin/WebSiteContentCreator/WebsiteUser).
export async function createUserViaApi(opts: {
  name: string
  email: string
  password: string
  role: string
  applicationId?: string
}): Promise<CreatedUser> {
  const ctx = await pwRequest.newContext({ baseURL: SERVER_URL })
  try {
    const login = await ctx.post('/api/auth/login', {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    })
    if (!login.ok()) throw new Error(`admin login failed: ${login.status()}`)
    const { token } = await login.json()

    const res = await ctx.post('/api/users', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        name: opts.name,
        email: opts.email,
        password: opts.password,
        role: opts.role,
        applications: opts.applicationId ? [opts.applicationId] : [],
      },
    })
    const body = await res.json()
    if (!res.ok()) throw new Error(`createUser failed: ${res.status()} ${JSON.stringify(body)}`)
    return body
  } finally {
    await ctx.dispose()
  }
}

// Unique email per call — safe across parallel Playwright workers (each runs
// its own beforeAll). Date.now() alone collides when two workers hit the same
// millisecond, which now 409s since the seed enforces the unique-email index,
// so mix in the worker index and a random suffix.
export function uniqueEmail(prefix: string): string {
  const worker = process.env.TEST_WORKER_INDEX ?? '0'
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${Date.now()}-w${worker}-${rand}@nirvana-cms.test`
}

// Fills and submits the real login form. Does not wait for navigation — callers
// assert the resulting URL/state themselves (some logins are expected to fail).
export async function loginViaUi(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
}

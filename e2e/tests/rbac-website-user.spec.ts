import { expect, test } from '@playwright/test'
import { createUserViaApi, loginViaUi, uniqueEmail } from '../support/rbac'

// Set by e2e/global-setup.ts after seeding the e2e database.
const applicationId = process.env.E2E_APPLICATION_ID!

// A WebsiteUser has no admin-panel access at all. This verifies that logging in
// as one is rejected and the user stays on /login (never reaches the app).
//
// NOTE ON THE MESSAGE: the seam actually enforced is server-side — authController
// short-circuits a WebsiteUser with 403 "Access denied" BEFORE checking the
// password (authController.js). So the login POST never returns a user object,
// which means Login.tsx's own role check ("...doesn't have access to the admin
// panel") is unreachable dead code in this real full-stack setup — the string
// surfaced is the server's "Access denied". The security property the task
// cares about (a WebsiteUser cannot enter the admin panel) holds, and is in
// fact enforced earlier/harder than the client check; this test asserts that
// real behavior rather than the unreachable client string.
test.use({ storageState: { cookies: [], origins: [] } })

const password = 'E2eSiteUser!2026'
let storedEmail: string

test.beforeAll(async () => {
  // A WebsiteUser's stored email is "[appId]-[rawEmail]" (userController.buildEmail),
  // and login looks up by the stored email — so use the returned value to log in.
  const rawEmail = uniqueEmail('e2e-siteuser')
  const created = await createUserViaApi({
    name: 'E2E Website User',
    email: rawEmail,
    password,
    role: 'WebsiteUser',
    applicationId,
  })
  storedEmail = created.email
})

test.describe('rbac — website user', () => {
  test('cannot log into the admin panel and stays on /login', async ({ page }) => {
    await loginViaUi(page, storedEmail, password)

    await expect(page.getByText('Access denied')).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
    // Never reached the app shell.
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  })
})

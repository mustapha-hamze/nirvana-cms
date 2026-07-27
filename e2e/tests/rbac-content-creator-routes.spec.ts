import { expect, test } from '@playwright/test'
import { CREATOR_EMAIL, CREATOR_PASSWORD } from '../env'
import { loginViaUi } from '../support/rbac'

// Set by e2e/global-setup.ts after seeding the e2e database.
const applicationId = process.env.E2E_APPLICATION_ID!

// Route-access coverage for the seeded WebSiteContentCreator, extending
// rbac.spec.ts (which covered draft-only + foreign-app redirect). Verifies the
// ProtectedRoute role gates in App.tsx: a content creator is bounced to /login
// from the app-admin screens (Categories/Tags/Users) and the SuperAdmin-only
// screens (/applications, /super-admins).
test.use({ storageState: { cookies: [], origins: [] } })

test.describe('rbac — content creator route gates', () => {
  test('is redirected from admin-only and superadmin-only routes', async ({ page }) => {
    await loginViaUi(page, CREATOR_EMAIL, CREATOR_PASSWORD)
    await page.waitForURL(`**/applications/${applicationId}/dashboard`)

    const blockedRoutes = [
      `/applications/${applicationId}/categories`, // roles: SuperAdmin, WebSiteAdmin
      `/applications/${applicationId}/tags`, // roles: SuperAdmin, WebSiteAdmin
      `/applications/${applicationId}/users`, // roles: SuperAdmin
      '/applications', // roles: SuperAdmin
      '/super-admins', // roles: SuperAdmin
    ]

    for (const route of blockedRoutes) {
      await page.goto(route)
      await page.waitForURL('**/login')
      await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    }
  })

  test('can still reach its own allowed screens', async ({ page }) => {
    await loginViaUi(page, CREATOR_EMAIL, CREATOR_PASSWORD)
    await page.waitForURL(`**/applications/${applicationId}/dashboard`)

    // Sanity check the negative test above isn't just "every route redirects":
    // Contents is roles={SuperAdmin, WebSiteAdmin, WebSiteContentCreator}.
    await page.goto(`/applications/${applicationId}/contents`)
    await expect(page.getByRole('heading', { name: 'Contents', exact: true })).toBeVisible()
  })
})

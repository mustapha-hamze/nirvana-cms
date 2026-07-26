import { expect, test, type Page } from '@playwright/test'
import { CREATOR_EMAIL, CREATOR_PASSWORD } from '../env'

// Set by e2e/global-setup.ts after seeding the e2e database.
const applicationId = process.env.E2E_APPLICATION_ID

// Access-control coverage for a non-SuperAdmin. These tests run as the seeded
// WebSiteContentCreator, so they opt OUT of the shared SuperAdmin storageState
// and log in for real per test (a fresh, empty context each time — the JWT the
// app stores in localStorage lives only for that context).
test.use({ storageState: { cookies: [], origins: [] } })

async function loginAsCreator(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email address').fill(CREATOR_EMAIL)
  await page.getByLabel('Password').fill(CREATOR_PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  // A content creator has exactly one app -> lands on that app's dashboard.
  await page.waitForURL(`**/applications/${applicationId}/dashboard`)
}

test.describe('rbac — content creator', () => {
  test('cannot publish content — the publish toggle is not rendered', async ({ page }) => {
    await loginAsCreator(page)

    await page.goto(`/applications/${applicationId}/contents/create`)
    await page.getByText('Select a language to add a translation for').waitFor()
    await page.getByRole('button', { name: 'English' }).click()
    await page.getByLabel('Title').fill(`Creator Draft ${Date.now()}`)
    await page.getByRole('button', { name: 'Create Content' }).first().click()

    // In edit mode now. The publish StatusToggle is gated behind canManage
    // (SuperAdmin/WebSiteAdmin only), so a content creator sees no switch —
    // status is stuck on "Draft".
    await expect(page.getByRole('heading', { name: 'Edit Content' })).toBeVisible()
    await expect(page.getByText('Draft', { exact: false })).toBeVisible()
    await expect(page.getByRole('switch')).toHaveCount(0)
  })

  test('is redirected to /login when opening an application it is not assigned to', async ({ page }) => {
    await loginAsCreator(page)

    // A valid-shaped ObjectId that is not this creator's application. ProtectedRoute
    // redirects any non-SuperAdmin away from an app they lack access to.
    const foreignAppId = '0123456789abcdef01234567'
    await page.goto(`/applications/${foreignAppId}/dashboard`)

    await page.waitForURL('**/login')
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  })
})

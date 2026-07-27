import { expect, test, type Page } from '@playwright/test'
import { createUserViaApi, loginViaUi, uniqueEmail } from '../support/rbac'

// Set by e2e/global-setup.ts after seeding the e2e database.
const applicationId = process.env.E2E_APPLICATION_ID!

// Positive-permission coverage for a WebSiteAdmin — the app-admin role. It CAN
// do everything a WebSiteContentCreator can't (publish, delete, manage
// taxonomy, toggle a page homepage), but is still NOT a SuperAdmin, so the
// SuperAdmin-only screens (/applications, /super-admins) redirect it away.
//
// These run as a freshly-created WebSiteAdmin, so they opt out of the shared
// SuperAdmin storageState and log in for real per test (own context each time).
test.use({ storageState: { cookies: [], origins: [] } })

const password = 'E2eWebAdmin!2026'
let email: string

test.beforeAll(async () => {
  email = uniqueEmail('e2e-webadmin')
  await createUserViaApi({
    name: 'E2E Web Admin',
    email,
    password,
    role: 'WebSiteAdmin',
    applicationId,
  })
})

async function login(page: Page) {
  await loginViaUi(page, email, password)
  await page.waitForURL(`**/applications/${applicationId}/dashboard`)
}

test.describe('rbac — website admin', () => {
  test('can publish and delete content (app-admin actions)', async ({ page }) => {
    await login(page)
    const title = `WebAdmin Content ${Date.now()}`

    await page.goto(`/applications/${applicationId}/contents/create`)
    await page.getByText('Select a language to add a translation for').waitFor()
    await page.getByRole('button', { name: 'English' }).click()
    await page.getByLabel('Title').fill(title)
    await page.getByRole('button', { name: 'Create Content' }).first().click()
    await expect(page.getByRole('heading', { name: 'Edit Content' })).toBeVisible()

    // The publish StatusToggle IS rendered for canManage roles (contrast with
    // rbac.spec.ts, where a ContentCreator sees no switch).
    const publish = page.getByRole('switch', { name: 'Publish' })
    await expect(publish).toBeVisible()
    await publish.click()
    await expect(page.getByText('Published', { exact: false })).toBeVisible()
    await page.getByRole('button', { name: 'Save Changes' }).first().click()
    await expect(page.getByText('Content has been updated')).toBeVisible()

    // Delete is userIsAppAdmin-only server-side — a WebSiteAdmin qualifies.
    await page.getByRole('button', { name: 'Back to Contents' }).click()
    const row = page.getByRole('row').filter({ hasText: title })
    await expect(row).toBeVisible()
    await row.getByRole('button', { name: 'Delete' }).click()
    await page.getByRole('button', { name: 'Delete Content' }).click()
    await expect(page.getByRole('row').filter({ hasText: title })).toHaveCount(0)
  })

  test('can reach the admin-only Categories screen and toggle a page homepage', async ({ page }) => {
    await login(page)

    // Categories is roles={SuperAdmin, WebSiteAdmin} — reachable (not bounced to /login).
    await page.goto(`/applications/${applicationId}/categories`)
    await expect(page.getByRole('heading', { name: 'Categories', exact: true })).toBeVisible()

    // Create a page and confirm the admin-only Homepage toggle renders.
    await page.goto(`/applications/${applicationId}/pages/create`)
    await page.getByText('Select a language to add a translation for').waitFor()
    await page.getByRole('button', { name: 'English' }).click()
    await page.getByLabel('Title').fill(`WebAdmin Page ${Date.now()}`)
    await page.getByRole('button', { name: 'Create Page' }).first().click()
    await expect(page.getByRole('heading', { name: 'Edit Page' })).toBeVisible()

    await expect(page.getByRole('switch', { name: 'Set as homepage' })).toBeVisible()
    await expect(page.getByRole('switch', { name: 'Publish' })).toBeVisible()
  })

  test('is redirected away from SuperAdmin-only routes', async ({ page }) => {
    await login(page)

    for (const route of ['/applications', '/super-admins']) {
      await page.goto(route)
      await page.waitForURL('**/login')
      await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    }
  })
})

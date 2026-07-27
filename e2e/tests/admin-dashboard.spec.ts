import { expect, test } from '@playwright/test'

// Set by e2e/global-setup.ts after seeding the e2e database.
const applicationId = process.env.E2E_APPLICATION_ID

// The per-application Dashboard (Dashboard.tsx) is read-only stat cards, so
// this is a smoke test: it renders the right application's overview and status.
// The seeded "E2E Test App" is active with no description.
test.describe('application dashboard', () => {
  test('renders the overview and status for the application', async ({ page }) => {
    await page.goto(`/applications/${applicationId}/dashboard`)

    await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible()
    await expect(page.getByText('Overview for E2E Test App')).toBeVisible()

    // Status card reflects the seeded app's active status.
    await expect(page.getByText('Status', { exact: true })).toBeVisible()
    await expect(page.getByText('Active', { exact: true })).toBeVisible()
    // Other read-only cards render too.
    await expect(page.getByText('Created', { exact: true })).toBeVisible()
    await expect(page.getByText('Description', { exact: true })).toBeVisible()
  })
})

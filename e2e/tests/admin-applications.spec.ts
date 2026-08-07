import { expect, test } from '@playwright/test'

// SuperAdmin-only Applications screen: create an application, edit it by
// toggling its active/inactive status (PATCH /applications/:id/status), then
// delete it. Runs as the seeded SuperAdmin (shared storageState) and only ever
// touches the app it creates itself — never the seeded "E2E Test App" the
// other specs depend on.
test.describe('admin applications', () => {
  test('creates, toggles status for, and deletes an application', async ({ page }) => {
    const name = 'Playwright Spec App'

    await page.goto('/applications')
    await expect(page.getByRole('heading', { name: 'Applications', exact: true })).toBeVisible()

    // ── Create ──────────────────────────────────────────────────────────
    await page.getByRole('button', { name: 'Create Application' }).click()
    const createModal = page.getByRole('dialog')
    // Create modal uses the FormField TextField (label is associated) — unlike
    // the settings modal, so getByLabel is safe here.
    await createModal.getByLabel('Application name').fill(name)
    await createModal.getByLabel('Description').fill('Created by the e2e suite')
    await createModal.getByRole('button', { name: 'Create Application' }).click()

    const card = page.locator('[data-slot="card"]').filter({ hasText: name })
    await expect(card).toBeVisible()
    // New apps default to active.
    await expect(card.getByText('Active', { exact: true })).toBeVisible()

    // ── Edit: toggle active -> inactive ─────────────────────────────────
    await card.getByRole('switch').click()
    await expect(card.getByText('Inactive', { exact: true })).toBeVisible()

    // ── Delete ──────────────────────────────────────────────────────────
    await card.getByRole('button', { name: 'Delete' }).click()
    await page.getByRole('button', { name: 'Delete Application' }).click()

    await expect(page.locator('[data-slot="card"]').filter({ hasText: name })).toHaveCount(0)
  })
})

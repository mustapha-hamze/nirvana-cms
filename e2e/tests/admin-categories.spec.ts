import { expect, test } from '@playwright/test'

// Set by e2e/global-setup.ts after seeding the e2e database — see
// server/scripts/e2eSeed.js for what it creates.
const applicationId = process.env.E2E_APPLICATION_ID

test.describe('admin categories', () => {
  test('lists, creates, edits, and deletes a category against the real API', async ({ page }) => {
    await page.goto(`/applications/${applicationId}/categories`)

    // { exact: true } avoids a strict-mode collision with the empty state's
    // "No categories yet" heading — non-exact matching is a case-insensitive
    // substring match, and "categories" is a substring of that too.
    await expect(page.getByRole('heading', { name: 'Categories', exact: true })).toBeVisible()
    await expect(page.getByText('0 categories in E2E Test App')).toBeVisible()
    await expect(page.getByText('No categories yet')).toBeVisible()

    // Two "Create Category" buttons exist while the list is empty — the page
    // header's and the empty state's own — either opens the same modal.
    await page.getByRole('button', { name: 'Create Category' }).first().click()
    const modal = page.getByRole('dialog')
    await modal.getByPlaceholder('e.g. News').fill('Guides')
    await modal.getByRole('button', { name: 'Create Category' }).click()

    await expect(page.getByRole('cell', { name: /Guides/ })).toBeVisible()
    await expect(page.getByText('1 category in E2E Test App')).toBeVisible()

    const guidesRow = page.getByRole('row').filter({ hasText: 'Guides' })
    await guidesRow.getByRole('button', { name: 'Edit' }).click()
    await modal.getByPlaceholder('e.g. News').fill('Editorial Guides')
    await modal.getByRole('button', { name: 'Save Changes' }).click()

    await expect(page.getByRole('cell', { name: /Editorial Guides/ })).toBeVisible()

    const editedRow = page.getByRole('row').filter({ hasText: 'Editorial Guides' })
    await editedRow.getByRole('button', { name: 'Delete' }).click()
    await page.getByRole('button', { name: 'Delete Category' }).click()

    await expect(page.getByRole('cell', { name: /Editorial Guides/ })).toHaveCount(0)
    await expect(page.getByText('No categories yet')).toBeVisible()
  })
})

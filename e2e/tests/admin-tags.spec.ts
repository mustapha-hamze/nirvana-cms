import { expect, test } from '@playwright/test'

// Set by e2e/global-setup.ts after seeding the e2e database.
const applicationId = process.env.E2E_APPLICATION_ID

// Tags CRUD — mirrors admin-categories.spec.ts. Tags are flat (no parent/child)
// so this is the simpler of the two taxonomy screens. Same shadcn/Radix dialog
// (role="dialog") + getByPlaceholder convention as the categories spec, since
// the translated-title field's accessible name is "Title (English) *", not its
// placeholder.
test.describe('admin tags', () => {
  test('lists, creates, edits, and deletes a tag against the real API', async ({ page }) => {
    await page.goto(`/applications/${applicationId}/tags`)

    await expect(page.getByRole('heading', { name: 'Tags', exact: true })).toBeVisible()

    // Two "Create Tag" buttons exist while the list is empty (header + empty
    // state) — either opens the same modal.
    await page.getByRole('button', { name: 'Create Tag' }).first().click()
    const modal = page.getByRole('dialog')
    await modal.getByPlaceholder('e.g. Breaking').fill('Breaking')
    await modal.getByRole('button', { name: 'Create Tag' }).click()

    await expect(page.getByRole('cell', { name: /Breaking/ })).toBeVisible()

    const tagRow = page.getByRole('row').filter({ hasText: 'Breaking' })
    await tagRow.getByRole('button', { name: 'Edit' }).click()
    await modal.getByPlaceholder('e.g. Breaking').fill('Breaking News')
    await modal.getByRole('button', { name: 'Save Changes' }).click()

    await expect(page.getByRole('cell', { name: /Breaking News/ })).toBeVisible()

    const editedRow = page.getByRole('row').filter({ hasText: 'Breaking News' })
    await editedRow.getByRole('button', { name: 'Delete' }).click()
    await page.getByRole('button', { name: 'Delete Tag' }).click()

    await expect(page.getByRole('cell', { name: /Breaking News/ })).toHaveCount(0)
  })
})

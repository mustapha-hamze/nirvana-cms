import { expect, test } from '@playwright/test'

// Set by e2e/global-setup.ts after seeding the e2e database.
const applicationId = process.env.E2E_APPLICATION_ID

// The most complex editor: per-language drafts + a dynamic sections/elements
// body. Drives the full lifecycle as a SuperAdmin (canManage = true):
//   pick language -> fill title -> create (draft) -> add a body section with a
//   paragraph -> save -> publish -> verify in list -> delete.
// The Body panel, taxonomy, SEO, and the publish toggle only appear AFTER the
// first create (the editor flips from "create" to "edit" in place), which is
// why the section is added in a second step rather than on the create form.
test.describe('admin contents', () => {
  test('creates, edits body, publishes, and deletes a content item', async ({ page }) => {
    const title = `Brewing Coffee ${Date.now()}`
    const bodyText = 'Start with fresh, coarsely ground beans.'

    await page.goto(`/applications/${applicationId}/contents/create`)
    await expect(page.getByRole('heading', { name: 'Create Content' })).toBeVisible()

    // ── Pick a language, then fill the primary fields ───────────────────
    await page.getByText('Select a language to add a translation for').waitFor()
    await page.getByRole('button', { name: 'English' }).click()
    await page.getByLabel('Title').fill(title)

    // Two "Create Content" buttons (page header + bottom action bar) — either
    // saves; take the header one.
    await page.getByRole('button', { name: 'Create Content' }).first().click()

    // Create succeeds -> editor flips to edit mode at the new /edit URL.
    await expect(page.getByRole('heading', { name: 'Edit Content' })).toBeVisible()
    await page.waitForURL('**/contents/*/edit')

    // ── Add a Text (1 column) body section with a paragraph ─────────────
    await page.getByRole('button', { name: 'Body' }).click()
    await page.getByRole('button', { name: 'Add Section' }).click()
    await page.getByRole('menuitem', { name: 'Text (1 column)' }).click()
    await page.getByLabel('Text', { exact: false }).fill(bodyText)

    await page.getByRole('button', { name: 'Save Changes' }).first().click()
    await expect(page.getByText('Content has been updated')).toBeVisible()

    // ── Publish (SuperAdmin-only toggle) ────────────────────────────────
    await page.getByRole('switch').click()
    await expect(page.getByText('Published', { exact: false })).toBeVisible()
    await page.getByRole('button', { name: 'Save Changes' }).first().click()
    await expect(page.getByText('Content has been updated')).toBeVisible()

    // ── Back to the list, confirm it's there, then delete ───────────────
    await page.getByRole('button', { name: 'Back to Contents' }).click()
    await expect(page.getByRole('heading', { name: 'Contents', exact: true })).toBeVisible()

    const row = page.getByRole('row').filter({ hasText: title })
    await expect(row).toBeVisible()
    await row.getByRole('button', { name: 'Delete' }).click()
    await page.getByRole('button', { name: 'Delete Content' }).click()

    await expect(page.getByRole('row').filter({ hasText: title })).toHaveCount(0)
  })
})

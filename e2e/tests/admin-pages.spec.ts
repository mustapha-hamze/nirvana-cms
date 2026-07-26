import { expect, test } from '@playwright/test'

// Set by e2e/global-setup.ts after seeding the e2e database.
const applicationId = process.env.E2E_APPLICATION_ID

// Pages mirror Contents structurally (per-language drafts, in-place create->
// edit flip, admin-only publish toggle) but their body is a list of generic
// section containers rather than one typed layout. Full lifecycle as a
// SuperAdmin: pick language -> title -> create -> add a section -> save ->
// publish -> verify in list -> delete.
test.describe('admin pages', () => {
  test('creates, adds a section, publishes, and deletes a page', async ({ page }) => {
    const title = `About Us ${Date.now()}`

    await page.goto(`/applications/${applicationId}/pages/create`)
    await expect(page.getByRole('heading', { name: 'Create Page' })).toBeVisible()

    // ── Pick a language, then fill the title ────────────────────────────
    await page.getByText('Select a language to add a translation for').waitFor()
    await page.getByRole('button', { name: 'English' }).click()
    await page.getByLabel('Title').fill(title)

    await page.getByRole('button', { name: 'Create Page' }).first().click()

    await expect(page.getByRole('heading', { name: 'Edit Page' })).toBeVisible()
    await page.waitForURL('**/pages/*/edit')

    // ── Add a (generic container) section, then save ────────────────────
    await page.getByRole('button', { name: 'Add Section' }).click()
    await page.getByRole('button', { name: 'Save Changes' }).first().click()
    await expect(page.getByText('Page has been updated')).toBeVisible()

    // ── Publish (SuperAdmin-only toggle) ────────────────────────────────
    // Two switches exist here — the homepage toggle and the status toggle —
    // so target the status one by its accessible name ("Publish" when unpublished).
    await page.getByRole('switch', { name: 'Publish' }).click()
    await expect(page.getByText('Published', { exact: false })).toBeVisible()
    await page.getByRole('button', { name: 'Save Changes' }).first().click()
    await expect(page.getByText('Page has been updated')).toBeVisible()

    // ── Back to the list, confirm it's there, then delete ───────────────
    await page.getByRole('button', { name: 'Back to Pages' }).click()
    await expect(page.getByRole('heading', { name: 'Pages', exact: true })).toBeVisible()

    const row = page.getByRole('row').filter({ hasText: title })
    await expect(row).toBeVisible()
    await row.getByRole('button', { name: 'Delete' }).click()
    await page.getByRole('button', { name: 'Delete Page' }).click()

    await expect(page.getByRole('row').filter({ hasText: title })).toHaveCount(0)
  })
})

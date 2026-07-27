import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => path.join(__dirname, '..', 'fixtures', name)

// Set by e2e/global-setup.ts after seeding the e2e database.
const applicationId = process.env.E2E_APPLICATION_ID

// File-upload coverage for the PAGE editor. Documents only have an upload path
// on the page side (a Media Gallery item with mediaType: "document"), so this
// is where the document leg of the upload surface is exercised. Also covers a
// page-domain image upload (stored under storage/images/pages, kept separate
// from content's), and the Media Gallery element/component type (priority #4).
//
// Reaching a gallery item's editor is deep: create page -> add a section ->
// expand it -> add a Media Gallery component -> expand it -> the first gallery
// item's editor is then visible. This helper drives that once per test.
async function openFirstGalleryItem(page: Page, title: string) {
  await page.goto(`/applications/${applicationId}/pages/create`)
  await page.getByText('Select a language to add a translation for').waitFor()
  await page.getByRole('button', { name: 'English' }).click()
  await page.getByLabel('Title').fill(title)
  await page.getByRole('button', { name: 'Create Page' }).first().click()
  await expect(page.getByRole('heading', { name: 'Edit Page' })).toBeVisible()
  await page.waitForURL('**/pages/*/edit')

  await page.getByRole('button', { name: 'Add Section' }).click()
  // A fresh section starts collapsed; its "Add Component" picker only shows
  // once expanded (chevron button, accessible name from its title attribute).
  await page.getByRole('button', { name: 'Expand this section' }).click()
  await page.getByRole('button', { name: 'Add Component' }).click()
  // Menu items carry label + description text, so this is a substring match on
  // the label — unique to the gallery option.
  await page.getByRole('menuitem', { name: 'Media Gallery' }).click()
  // The component too starts collapsed.
  await page.getByRole('button', { name: 'Expand this component' }).click()
}

test.describe('admin page uploads', () => {
  test('uploads an image into a Media Gallery item and saves', async ({ page }) => {
    await openFirstGalleryItem(page, `Page Gallery Image ${Date.now()}`)

    // Gallery items default to mediaType "image" -> ImageUploadField is shown.
    await page.locator('input[type="file"][accept*="image/"]').setInputFiles(fixture('sample.png'))
    await expect(page.locator('img[src*="/storage/images/pages/"]')).toBeVisible()

    await page.getByRole('button', { name: 'Save Changes' }).first().click()
    await expect(page.getByText('Page has been updated')).toBeVisible()
  })

  test('uploads a document into a Media Gallery item and saves', async ({ page }) => {
    await openFirstGalleryItem(page, `Page Gallery Doc ${Date.now()}`)

    // Switch the item's media type to Document (Radix Select) — that swaps the
    // image field for the document FileUploadField.
    await page.getByLabel('Media type').click()
    await page.getByRole('option', { name: 'Document' }).click()

    // Two file inputs exist for a document item (the document itself + an
    // optional thumbnail image) — target the document one by its accept filter.
    await page
      .locator('input[type="file"][accept*="application/pdf"]')
      .setInputFiles(fixture('sample.pdf'))
    await expect(page.locator('a[href*="/storage/documents/pages/"]')).toBeVisible()

    await page.getByRole('button', { name: 'Save Changes' }).first().click()
    await expect(page.getByText('Page has been updated')).toBeVisible()
  })
})

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => path.join(__dirname, '..', 'fixtures', name)

// Set by e2e/global-setup.ts after seeding the e2e database.
const applicationId = process.env.E2E_APPLICATION_ID

// File-upload coverage for the CONTENT editor — the highest-risk untested path
// (also where the magic-byte security fix in rawFileUpload.js landed). Each
// test drives the real UI: create a content item, add a body section whose
// element carries an upload field, setInputFiles a real fixture, and confirm
// the upload is accepted (preview/filename shown) and the save succeeds.
//
// Positive fixtures are tiny but correctly-signed: images actually decode via
// sharp; videos just need the `ftyp` box the magic-byte check looks for.
async function createContentInEditMode(page: import('@playwright/test').Page, title: string) {
  await page.goto(`/applications/${applicationId}/contents/create`)
  await page.getByText('Select a language to add a translation for').waitFor()
  await page.getByRole('button', { name: 'English' }).click()
  await page.getByLabel('Title').fill(title)
  await page.getByRole('button', { name: 'Create Content' }).first().click()
  await expect(page.getByRole('heading', { name: 'Edit Content' })).toBeVisible()
  await page.waitForURL('**/contents/*/edit')
}

test.describe('admin content uploads', () => {
  test('uploads an image into an Image section and saves', async ({ page }) => {
    await createContentInEditMode(page, `Image Upload ${Date.now()}`)

    await page.getByRole('button', { name: 'Body' }).click()
    await page.getByRole('button', { name: 'Add Section' }).click()
    // { exact: true } — "Image" would otherwise also match "Text + Image",
    // "Two Images", and "Image Gallery" in the section-type menu.
    await page.getByRole('menuitem', { name: 'Image', exact: true }).click()

    await page.locator('input[type="file"]').setInputFiles(fixture('sample.png'))

    // On success ImageUploadField mounts an <img> preview of the stored file.
    const preview = page.locator('img[src*="/storage/images/contents/"]')
    await expect(preview).toBeVisible()

    await page.getByRole('button', { name: 'Save Changes' }).first().click()
    await expect(page.getByText('Content has been updated')).toBeVisible()
  })

  test('uploads a self-hosted video into a Video section and saves', async ({ page }) => {
    await createContentInEditMode(page, `Video Upload ${Date.now()}`)

    await page.getByRole('button', { name: 'Body' }).click()
    await page.getByRole('button', { name: 'Add Section' }).click()
    await page.getByRole('menuitem', { name: 'Video', exact: true }).click()

    await page.locator('input[type="file"]').setInputFiles(fixture('sample.mp4'))

    // FileUploadField shows a link to the uploaded file (the stored filename).
    await expect(page.locator('a[href*="/storage/videos/contents/"]')).toBeVisible()

    await page.getByRole('button', { name: 'Save Changes' }).first().click()
    await expect(page.getByText('Content has been updated')).toBeVisible()
  })

  // Regression test for the magic-byte verification fix: a .mp4-named file whose
  // bytes are plain text has a video/mp4 Content-Type (so it clears multer's
  // fileFilter) but no `ftyp` signature, so saveRawFile must reject it 400.
  test('rejects a file whose bytes do not match its declared video type', async ({ page }) => {
    await createContentInEditMode(page, `Bad Video Upload ${Date.now()}`)

    await page.getByRole('button', { name: 'Body' }).click()
    await page.getByRole('button', { name: 'Add Section' }).click()
    await page.getByRole('menuitem', { name: 'Video', exact: true }).click()

    await page.locator('input[type="file"]').setInputFiles(fixture('not-a-video.mp4'))

    // Server 400 surfaces in FileUploadField's inline error; no file link appears.
    await expect(page.getByText('Video must be MP4, WebM, or MOV')).toBeVisible()
    await expect(page.locator('a[href*="/storage/videos/contents/"]')).toHaveCount(0)
  })
})

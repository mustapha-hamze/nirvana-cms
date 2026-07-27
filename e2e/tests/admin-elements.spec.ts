import { expect, test, type Page } from '@playwright/test'

// Set by e2e/global-setup.ts after seeding the e2e database.
const applicationId = process.env.E2E_APPLICATION_ID

// Broader element-type coverage beyond the single paragraph element the first
// pass exercised (priority #4). Upload-bearing types (image/video/gallery) are
// covered in the admin-uploads-* specs; this adds one structurally-distinct
// non-upload type per domain: a content Heading (an element slot with a type
// switcher) and a page Call to Action (a multi-field component).
test.describe('admin content elements', () => {
  test('adds a Heading element to a Text section and saves', async ({ page }) => {
    await page.goto(`/applications/${applicationId}/contents/create`)
    await page.getByText('Select a language to add a translation for').waitFor()
    await page.getByRole('button', { name: 'English' }).click()
    await page.getByLabel('Title').fill(`Heading Element ${Date.now()}`)
    await page.getByRole('button', { name: 'Create Content' }).first().click()
    await expect(page.getByRole('heading', { name: 'Edit Content' })).toBeVisible()
    await page.waitForURL('**/contents/*/edit')

    await page.getByRole('button', { name: 'Body' }).click()
    await page.getByRole('button', { name: 'Add Section' }).click()
    await page.getByRole('menuitem', { name: 'Text (1 column)' }).click()

    // A text slot accepts paragraph/richText/heading/textInput, so it renders a
    // type switcher — flip this element from the default paragraph to Heading.
    await page.getByRole('button', { name: 'Heading', exact: true }).click()
    await page.getByLabel('Heading Text').fill('Chapter One')

    await page.getByRole('button', { name: 'Save Changes' }).first().click()
    await expect(page.getByText('Content has been updated')).toBeVisible()
  })
})

test.describe('admin page elements', () => {
  async function createPageInEditMode(page: Page, title: string) {
    await page.goto(`/applications/${applicationId}/pages/create`)
    await page.getByText('Select a language to add a translation for').waitFor()
    await page.getByRole('button', { name: 'English' }).click()
    await page.getByLabel('Title').fill(title)
    await page.getByRole('button', { name: 'Create Page' }).first().click()
    await expect(page.getByRole('heading', { name: 'Edit Page' })).toBeVisible()
    await page.waitForURL('**/pages/*/edit')
  }

  test('adds a Call to Action component and saves', async ({ page }) => {
    await createPageInEditMode(page, `CTA Component ${Date.now()}`)

    await page.getByRole('button', { name: 'Add Section' }).click()
    await page.getByRole('button', { name: 'Expand this section' }).click()
    await page.getByRole('button', { name: 'Add Component' }).click()
    // "Call to Action" as a substring also appears in the Hero Slider and
    // Banner descriptions ("...heading and call to action"), so anchor to the
    // start of the accessible name (label first) to hit only the CTA option.
    await page.getByRole('menuitem', { name: /^Call to Action/ }).click()
    await page.getByRole('button', { name: 'Expand this component' }).click()

    // Label/Link appear twice (primary & secondary) so they'd be ambiguous;
    // the required Heading (accessible name "Heading *") and Subheading are
    // unique and suffice to prove the multi-field CTA element persists. Plain
    // "Heading" would also substring-match "Subheading", hence exact names.
    await page.getByLabel('Heading *', { exact: true }).fill('Ready to get started?')
    await page.getByLabel('Subheading', { exact: true }).fill('Join thousands of teams already on board.')

    await page.getByRole('button', { name: 'Save Changes' }).first().click()
    await expect(page.getByText('Page has been updated')).toBeVisible()
  })
})

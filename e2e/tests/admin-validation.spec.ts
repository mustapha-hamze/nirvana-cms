import { expect, test } from '@playwright/test'

// Set by e2e/global-setup.ts after seeding the e2e database.
const applicationId = process.env.E2E_APPLICATION_ID

// Negative / validation-path coverage for the highest-value create flows — the
// first pass was happy-path only. Each asserts a real error surfaces AND the
// form does not submit (no row created / no transition to edit mode).
test.describe('validation — required title', () => {
  test('category create rejects an empty title', async ({ page }) => {
    await page.goto(`/applications/${applicationId}/categories`)
    await expect(page.getByRole('heading', { name: 'Categories', exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'Create Category' }).first().click()
    const modal = page.getByRole('dialog')
    // Submit with no title -> CategoryModal's own guard sets an inline error and
    // keeps the modal open (no request sent).
    await modal.getByRole('button', { name: 'Create Category' }).click()

    await expect(modal.getByText('At least one language needs a title')).toBeVisible()
    await expect(modal).toBeVisible()
  })

  test('tag create rejects an empty title', async ({ page }) => {
    await page.goto(`/applications/${applicationId}/tags`)
    await expect(page.getByRole('heading', { name: 'Tags', exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'Create Tag' }).first().click()
    const modal = page.getByRole('dialog')
    await modal.getByRole('button', { name: 'Create Tag' }).click()

    await expect(modal.getByText('At least one language needs a title')).toBeVisible()
    await expect(modal).toBeVisible()
  })

  test('content create rejects an empty title', async ({ page }) => {
    await page.goto(`/applications/${applicationId}/contents/create`)
    await page.getByText('Select a language to add a translation for').waitFor()
    await page.getByRole('button', { name: 'English' }).click()
    // Leave the title blank and try to create.
    await page.getByRole('button', { name: 'Create Content' }).first().click()

    // Error shows in both the inline banner and a toast — either is fine; assert
    // one and that we're still on the (create) form, not flipped to edit mode.
    await expect(page.getByText('At least one language needs a title').first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Create Content' })).toBeVisible()
  })

  test('page create rejects an empty title', async ({ page }) => {
    await page.goto(`/applications/${applicationId}/pages/create`)
    await page.getByText('Select a language to add a translation for').waitFor()
    await page.getByRole('button', { name: 'English' }).click()
    await page.getByRole('button', { name: 'Create Page' }).first().click()

    await expect(page.getByText('At least one language needs a title').first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Create Page' })).toBeVisible()
  })
})

test.describe('validation — duplicate user email', () => {
  test('rejects creating a user with an email already in use', async ({ page }) => {
    const email = `e2e-dupe-${Date.now()}@nirvana-cms.test`

    await page.goto(`/applications/${applicationId}/users`)
    await expect(page.getByRole('heading', { name: 'Users', exact: true })).toBeVisible()

    // First create succeeds (default role is Content Creator, which the modal
    // scopes to this application) and closes the modal.
    await page.getByRole('button', { name: 'Create User' }).first().click()
    let modal = page.getByRole('dialog')
    await modal.getByLabel('Full name').fill('Dupe One')
    await modal.getByLabel('Email').fill(email)
    await modal.getByLabel('Password').fill('E2eUser!2026')
    await modal.getByRole('button', { name: 'Create User' }).click()
    await expect(page.getByRole('row').filter({ hasText: email })).toBeVisible()

    // Second create with the same email -> real server 409, surfaced inline.
    await page.getByRole('button', { name: 'Create User' }).first().click()
    modal = page.getByRole('dialog')
    await modal.getByLabel('Full name').fill('Dupe Two')
    await modal.getByLabel('Email').fill(email)
    await modal.getByLabel('Password').fill('E2eUser!2026')
    await modal.getByRole('button', { name: 'Create User' }).click()

    await expect(modal.getByText('A user with this email already exists')).toBeVisible()
    await expect(modal).toBeVisible()
  })
})

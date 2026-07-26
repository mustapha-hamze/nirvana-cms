import { expect, test } from '@playwright/test'

// Set by e2e/global-setup.ts after seeding the e2e database.
const applicationId = process.env.E2E_APPLICATION_ID

// SuperAdmin-only App Users screen: create a user, toggle their status, and
// edit their name/role. There is no delete-user action in this UI, so the
// created user persists in the isolated e2e DB (dropped at teardown). A unique
// email per run keeps reruns/retries from colliding on the unique-email
// constraint. Note the seeded WebSiteContentCreator ("E2E Creator") already
// appears in this list, so assertions target the specific row we create.
test.describe('admin app users', () => {
  test('creates, toggles status for, and edits a user against the real API', async ({ page }) => {
    const email = `e2e-user-${Date.now()}@nirvana-cms.test`
    const name = 'Jordan Lee'
    const renamed = 'Jordan Lee-Smith'

    await page.goto(`/applications/${applicationId}/users`)
    await expect(page.getByRole('heading', { name: 'Users', exact: true })).toBeVisible()

    // ── Create (as a Website Admin) ─────────────────────────────────────
    await page.getByRole('button', { name: 'Create User' }).first().click()
    const createModal = page.getByRole('dialog')
    await createModal.getByLabel('Full name').fill(name)
    await createModal.getByLabel('Email').fill(email)
    // Role is a Radix Select — open it and pick an option by its label.
    await createModal.getByLabel('Role').click()
    await page.getByRole('option', { name: 'Website Admin' }).click()
    await createModal.getByLabel('Password').fill('E2eUser!2026')
    await createModal.getByRole('button', { name: 'Create User' }).click()

    const userRow = page.getByRole('row').filter({ hasText: email })
    await expect(userRow).toBeVisible()
    await expect(userRow.getByText('Website Admin')).toBeVisible()
    await expect(userRow.getByText('Active')).toBeVisible()

    // ── Toggle status active -> inactive ────────────────────────────────
    await userRow.getByRole('switch').click()
    await expect(userRow.getByText('Inactive')).toBeVisible()

    // ── Edit the name ───────────────────────────────────────────────────
    await userRow.getByRole('button', { name: 'Edit' }).click()
    const editModal = page.getByRole('dialog')
    await editModal.getByLabel('Full name').fill(renamed)
    await editModal.getByRole('button', { name: 'Save Changes' }).click()

    await expect(page.getByRole('row').filter({ hasText: email }).getByText(renamed)).toBeVisible()
  })
})

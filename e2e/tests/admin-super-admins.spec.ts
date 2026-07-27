import { expect, test } from '@playwright/test'

// SuperAdmin-only /super-admins screen (SuperAdmins.tsx) — manages SuperAdmin
// accounts. Runs as the seeded SuperAdmin (shared storageState) and only ever
// touches the account it creates itself, never the seeded "E2E Admin" whose
// session every other spec depends on. Unique email per run so retries/reruns
// don't collide on the unique-email constraint (there is a real delete here, so
// a clean run removes its own row, but a mid-run retry could still overlap).
test.describe('super admins', () => {
  test('creates, edits, and deletes a super admin against the real API', async ({ page }) => {
    const email = `e2e-superadmin-${Date.now()}@nirvana-cms.test`
    const name = 'Alex Morgan'
    const renamed = 'Alex Morgan-Reyes'

    await page.goto('/super-admins')
    await expect(page.getByRole('heading', { name: 'Super Admins', exact: true })).toBeVisible()

    // ── Create ──────────────────────────────────────────────────────────
    await page.getByRole('button', { name: 'Add Super Admin' }).click()
    const createModal = page.getByRole('dialog')
    await createModal.getByLabel('Full name').fill(name)
    await createModal.getByLabel('Email').fill(email)
    await createModal.getByLabel('Password').fill('E2eSuper!2026')
    await createModal.getByRole('button', { name: 'Create Super Admin' }).click()

    const row = page.getByRole('row').filter({ hasText: email })
    await expect(row).toBeVisible()
    await expect(row.getByText(name)).toBeVisible()

    // ── Edit the name ───────────────────────────────────────────────────
    await row.getByRole('button', { name: 'Edit' }).click()
    const editModal = page.getByRole('dialog')
    await editModal.getByLabel('Full name').fill(renamed)
    await editModal.getByRole('button', { name: 'Save Changes' }).click()

    await expect(page.getByRole('row').filter({ hasText: email }).getByText(renamed)).toBeVisible()

    // ── Delete ──────────────────────────────────────────────────────────
    await page.getByRole('row').filter({ hasText: email }).getByRole('button', { name: 'Delete' }).click()
    await page.getByRole('button', { name: 'Delete Super Admin' }).click()

    await expect(page.getByRole('row').filter({ hasText: email })).toHaveCount(0)
  })
})

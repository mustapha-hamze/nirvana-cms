import { expect, test } from '@playwright/test'
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../env'

// Login is only exercised implicitly by global-setup (which saves the shared
// authenticated storageState the other specs reuse). These tests drive it
// directly. They opt OUT of that shared storageState — starting from a clean,
// unauthenticated context — so they never disturb the session other specs
// depend on and actually see the /login screen.
test.use({ storageState: { cookies: [], origins: [] } })

test.describe('login', () => {
  test('signs in with valid credentials and lands on Applications', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()

    await page.getByLabel('Email address').fill(ADMIN_EMAIL)
    await page.getByLabel('Password').fill(ADMIN_PASSWORD)
    await page.getByRole('button', { name: 'Sign in' }).click()

    await page.waitForURL('**/applications')
    await expect(page.getByRole('heading', { name: 'Applications', exact: true })).toBeVisible()
  })

  test('shows an error and stays on /login with a wrong password', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel('Email address').fill(ADMIN_EMAIL)
    await page.getByLabel('Password').fill('definitely-not-the-password')
    await page.getByRole('button', { name: 'Sign in' }).click()

    // The server responds 401 { message: 'Invalid credentials' }, surfaced in
    // the destructive Alert on the form.
    await expect(page.getByText('Invalid credentials')).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })
})

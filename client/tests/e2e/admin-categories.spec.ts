import { expect, test, type Page } from '@playwright/test'

const app = {
  _id: 'app-1',
  name: 'Nirvana Admin',
  logo: '',
}

const adminUser = {
  _id: 'user-1',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'SuperAdmin',
  applications: [{ _id: app._id, name: app.name }],
}

type Category = {
  _id: string
  publicId: string
  application: string
  title: string
  parentId: string | null
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

const initialCategories: Category[] = [
  {
    _id: 'cat-root',
    publicId: 'public-root',
    application: app._id,
    title: 'News',
    parentId: null,
    status: 'active',
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
  {
    _id: 'cat-child',
    publicId: 'public-child',
    application: app._id,
    title: 'Company',
    parentId: 'cat-root',
    status: 'inactive',
    createdAt: '2026-01-03T00:00:00.000Z',
    updatedAt: '2026-01-03T00:00:00.000Z',
  },
]

async function mockAdminApi(page: Page) {
  const categories = initialCategories.map((category) => ({ ...category }))
  let createdCount = 0

  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const method = request.method()
    const path = url.pathname.replace('/api', '')

    if (method === 'GET' && path === `/applications/${app._id}`) {
      await route.fulfill({ json: app })
      return
    }

    if (method === 'GET' && path === '/categories') {
      await route.fulfill({ json: categories })
      return
    }

    if (method === 'POST' && path === '/categories') {
      const body = request.postDataJSON() as Partial<Category>
      createdCount += 1
      const category: Category = {
        _id: `cat-created-${createdCount}`,
        publicId: `public-created-${createdCount}`,
        application: body.application ?? app._id,
        title: body.title ?? 'Untitled',
        parentId: body.parentId ?? null,
        status: body.status ?? 'active',
        createdAt: '2026-01-04T00:00:00.000Z',
        updatedAt: '2026-01-04T00:00:00.000Z',
      }
      categories.push(category)
      await route.fulfill({ status: 201, json: category })
      return
    }

    if (method === 'PUT' && path.startsWith('/categories/')) {
      const id = path.split('/').at(-1)
      const body = request.postDataJSON() as Partial<Category>
      const category = categories.find((item) => item._id === id)
      if (!category) {
        await route.fulfill({ status: 404, json: { message: 'Category not found' } })
        return
      }
      Object.assign(category, body, { updatedAt: '2026-01-05T00:00:00.000Z' })
      await route.fulfill({ json: category })
      return
    }

    if (method === 'DELETE' && path.startsWith('/categories/')) {
      const id = path.split('/').at(-1)
      const index = categories.findIndex((item) => item._id === id)
      if (index !== -1) categories.splice(index, 1)
      await route.fulfill({ status: 204, body: '' })
      return
    }

    await route.fulfill({ status: 404, json: { message: `Unhandled test route: ${method} ${path}` } })
  })
}

async function seedLoggedInAdmin(page: Page) {
  await page.addInitScript(({ token, user }) => {
    window.localStorage.setItem('token', token)
    window.localStorage.setItem('user', JSON.stringify(user))
  }, { token: 'test-token', user: adminUser })
}

test.describe('admin categories', () => {
  test.beforeEach(async ({ page }) => {
    await mockAdminApi(page)
    await seedLoggedInAdmin(page)
  })

  test('lists categories for the selected application', async ({ page }) => {
    await page.goto(`/applications/${app._id}/categories`)

    await expect(page.getByRole('heading', { name: 'Categories' })).toBeVisible()
    await expect(page.getByText('2 categories in Nirvana Admin')).toBeVisible()
    await expect(page.getByRole('cell', { name: 'News' })).toBeVisible()
    await expect(page.getByRole('cell', { name: /Company/ })).toBeVisible()
  })

  test('creates, edits, and deletes a category', async ({ page }) => {
    await page.goto(`/applications/${app._id}/categories`)

    await page.getByRole('button', { name: 'Create Category' }).click()
    const modal = page.locator('.fixed.inset-0')
    await modal.getByRole('textbox', { name: 'e.g. News' }).fill('Guides')
    await modal.getByRole('combobox').selectOption('cat-root')
    await modal.getByRole('button', { name: 'Create Category' }).click()

    await expect(page.getByRole('cell', { name: /Guides/ })).toBeVisible()

    const guidesRow = page.getByRole('row').filter({ hasText: 'Guides' })
    await guidesRow.getByRole('button', { name: 'Edit' }).click()
    await modal.getByRole('textbox', { name: 'e.g. News' }).fill('Editorial Guides')
    await modal.getByRole('button', { name: 'Save Changes' }).click()

    await expect(page.getByRole('cell', { name: /Editorial Guides/ })).toBeVisible()

    const editedRow = page.getByRole('row').filter({ hasText: 'Editorial Guides' })
    await editedRow.getByRole('button', { name: 'Delete' }).click()
    await page.getByRole('button', { name: 'Delete Category' }).click()

    await expect(page.getByRole('cell', { name: /Editorial Guides/ })).toHaveCount(0)
  })
})

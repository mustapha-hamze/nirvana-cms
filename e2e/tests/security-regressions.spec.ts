import {
  expect,
  test,
  request as playwrightRequest,
  type APIRequestContext,
} from '@playwright/test'
import { SERVER_URL, ADMIN_EMAIL, ADMIN_PASSWORD, STORAGE_STATE_PATH } from '../env'
import { createUserViaApi, loginViaUi, uniqueEmail } from '../support/rbac'

// Set by e2e/global-setup.ts after seeding the e2e database.
const applicationId = process.env.E2E_APPLICATION_ID!

// Regression coverage for security fixes that previously only had server-side
// Jest unit tests — exercised here through the real full-stack e2e server.
// The stored-URL and NoSQL-id-shape checks are API-level negative tests (no UI
// consumes these payloads directly); the deactivated-account check drives the
// real UI + a live session.

test.describe('security — stored URL + NoSQL id-shape validation', () => {
  let ctx: APIRequestContext
  let auth: Record<string, string>

  test.beforeAll(async () => {
    ctx = await playwrightRequest.newContext({ baseURL: SERVER_URL })
    const login = await ctx.post('/api/auth/login', {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    })
    expect(login.ok()).toBeTruthy()
    auth = { Authorization: `Bearer ${(await login.json()).token}` }
  })

  test.afterAll(async () => {
    await ctx.dispose()
  })

  test('rejects a javascript: URL in a content image element', async () => {
    const res = await ctx.post('/api/content', {
      headers: auth,
      data: {
        application: applicationId,
        details: [
          {
            langKey: 'en',
            title: `JS URL Content ${Date.now()}`,
            status: 'draft',
            sections: [
              {
                type: 'image-only',
                elements: [{ elementType: 'image', url: 'javascript:alert(1)', alt: 'x' }],
              },
            ],
          },
        ],
      },
    })
    expect(res.status()).toBe(400)
    expect((await res.json()).message).toContain('absolute http(s) URL')
  })

  test('rejects a javascript: URL in a page CTA element', async () => {
    const res = await ctx.post('/api/pages', {
      headers: auth,
      data: {
        application: applicationId,
        details: [
          {
            langKey: 'en',
            title: `JS URL Page ${Date.now()}`,
            status: 'draft',
            sections: [
              {
                components: [
                  {
                    type: 'cta',
                    elements: [
                      { elementType: 'cta', heading: 'x', ctaUrl: 'javascript:alert(1)' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    })
    expect(res.status()).toBe(400)
    expect((await res.json()).message).toContain('absolute http(s) URL')
  })

  test('rejects an operator-shaped parentId on category create (clean 400, not 500)', async () => {
    const res = await ctx.post('/api/categories', {
      headers: auth,
      data: {
        application: applicationId,
        translations: [{ langKey: 'en', title: `Cat ${Date.now()}` }],
        parentId: { $ne: null },
      },
    })
    expect(res.status()).toBe(400)
    expect((await res.json()).message).toBe('parentId must be a valid id')
  })

  test('rejects an operator-shaped parentId on category update (clean 400, not 500)', async () => {
    // Create a valid category first, then try to poison its parentId.
    const createRes = await ctx.post('/api/categories', {
      headers: auth,
      data: {
        application: applicationId,
        translations: [{ langKey: 'en', title: `Cat Upd ${Date.now()}` }],
      },
    })
    expect(createRes.status()).toBe(201)
    const categoryId = (await createRes.json())._id

    const res = await ctx.put(`/api/categories/${categoryId}`, {
      headers: auth,
      data: { parentId: { $ne: null } },
    })
    expect(res.status()).toBe(400)
    expect((await res.json()).message).toBe('parentId must be a valid id')
  })
})

// Deactivating a user must invalidate their EXISTING session, not just block
// future logins — authenticate() rejects a status:'inactive' user on every
// request. Runs the target user in this file's (empty-storageState) context;
// the SuperAdmin does the deactivation in a separate context via the real UI.
test.describe('security — deactivated account session invalidation', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  const password = 'E2eDeact!2026'
  let email: string

  test.beforeAll(async () => {
    email = uniqueEmail('e2e-deact')
    await createUserViaApi({
      name: 'E2E Deactivate Me',
      email,
      password,
      role: 'WebSiteAdmin',
      applicationId,
    })
  })

  test("rejects the user's live session once a SuperAdmin deactivates them", async ({ page, browser }) => {
    // 1) Target user logs in for real; their JWT now lives in this context.
    await loginViaUi(page, email, password)
    await page.waitForURL(`**/applications/${applicationId}/dashboard`)

    // Sanity: the session works before deactivation.
    const before = await page.evaluate(async (appId) => {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/content?application=${appId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.status
    }, applicationId)
    expect(before).toBe(200)

    // 2) A SuperAdmin deactivates the user through the real App Users UI.
    const adminContext = await browser.newContext({ storageState: STORAGE_STATE_PATH })
    try {
      const adminPage = await adminContext.newPage()
      await adminPage.goto(`/applications/${applicationId}/users`)
      const row = adminPage.getByRole('row').filter({ hasText: email })
      await expect(row).toBeVisible()
      await row.getByRole('switch').click()
      await expect(row.getByText('Inactive')).toBeVisible()

      // 3) The target user's existing session is now rejected (401) on its next action.
      await expect(async () => {
        const status = await page.evaluate(async (appId) => {
          const token = localStorage.getItem('token')
          const res = await fetch(`/api/content?application=${appId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          return res.status
        }, applicationId)
        expect(status).toBe(401)
      }).toPass()
    } finally {
      await adminContext.close()
    }
  })
})

import { expect, test, request as playwrightRequest, type APIRequestContext } from '@playwright/test'
import { SERVER_URL, APP_KEY, ADMIN_EMAIL, ADMIN_PASSWORD } from '../env'

// Set by e2e/global-setup.ts after seeding the e2e database.
const applicationId = process.env.E2E_APPLICATION_ID

// The public content-delivery API (/api/frontend) has no consuming UI in this
// repo, so it's tested directly with Playwright's API-request support (no
// browser). This spec is fully self-contained: it logs into the admin REST API
// to seed one PUBLISHED content, one DRAFT content, and one PUBLISHED page,
// then verifies appKey scoping, language defaulting, and that only published
// items surface publicly.
//
// A dedicated APIRequestContext hits the server (:5057) directly rather than
// going through the client preview's /api proxy.
test.describe('public frontend API', () => {
  let ctx: APIRequestContext
  let token: string
  const publishedTitle = `FE Published ${Date.now()}`
  const draftTitle = `FE Draft ${Date.now()}`
  const pageTitle = `FE Page ${Date.now()}`
  let publishedSlug: string

  test.beforeAll(async () => {
    ctx = await playwrightRequest.newContext({ baseURL: SERVER_URL })

    const loginRes = await ctx.post('/api/auth/login', {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    })
    expect(loginRes.ok()).toBeTruthy()
    token = (await loginRes.json()).token
    const auth = { Authorization: `Bearer ${token}` }

    // Published content (English).
    const pubRes = await ctx.post('/api/content', {
      headers: auth,
      data: {
        application: applicationId,
        details: [{ langKey: 'en', title: publishedTitle, headline: 'live', abstract: 'a', status: 'published' }],
      },
    })
    expect(pubRes.status()).toBe(201)
    publishedSlug = (await pubRes.json()).details[0].slug

    // Draft content — must NOT appear in the public listing.
    const draftRes = await ctx.post('/api/content', {
      headers: auth,
      data: {
        application: applicationId,
        details: [{ langKey: 'en', title: draftTitle, status: 'draft' }],
      },
    })
    expect(draftRes.status()).toBe(201)

    // Published page.
    const pageRes = await ctx.post('/api/pages', {
      headers: auth,
      data: {
        application: applicationId,
        details: [{ langKey: 'en', title: pageTitle, status: 'published' }],
      },
    })
    expect(pageRes.status()).toBe(201)
  })

  test.afterAll(async () => {
    await ctx.dispose()
  })

  test('requires an appKey', async () => {
    const res = await ctx.get('/api/frontend/settings')
    expect(res.status()).toBe(400)
    expect((await res.json()).message).toBe('appKey is required')
  })

  test('404s for an unknown appKey', async () => {
    const res = await ctx.get('/api/frontend/settings?appKey=does-not-exist')
    expect(res.status()).toBe(404)
    expect((await res.json()).message).toBe('Application not found')
  })

  test('returns application settings for a valid appKey', async () => {
    const res = await ctx.get(`/api/frontend/settings?appKey=${APP_KEY}`)
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.name).toBe('E2E Test App')
    // No explicit language config on the seeded app -> full system list.
    expect(body.languages).toContain('en')
  })

  test('lists only published content, scoped by appKey', async () => {
    const res = await ctx.get(`/api/frontend/contents?appKey=${APP_KEY}&lang=en`)
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    const titles = body.items.map((c: { title: string }) => c.title)
    expect(titles).toContain(publishedTitle)
    expect(titles).not.toContain(draftTitle)
  })

  test('fetches a single published content by slug (full detail)', async () => {
    const res = await ctx.get(`/api/frontend/contents/${publishedSlug}?appKey=${APP_KEY}&lang=en`)
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.title).toBe(publishedTitle)
    // Detail shape includes sections + metadata (list shape does not).
    expect(body).toHaveProperty('sections')
    expect(body).toHaveProperty('metadata')
  })

  test('lists the published page, scoped by appKey', async () => {
    const res = await ctx.get(`/api/frontend/pages?appKey=${APP_KEY}&lang=en`)
    expect(res.ok()).toBeTruthy()
    const titles = (await res.json()).map((p: { title: string }) => p.title)
    expect(titles).toContain(pageTitle)
  })

  test('rejects a language the application does not support', async () => {
    const res = await ctx.get(`/api/frontend/contents?appKey=${APP_KEY}&lang=de`)
    expect(res.status()).toBe(400)
    expect((await res.json()).message).toContain('lang must be one of')
  })
})

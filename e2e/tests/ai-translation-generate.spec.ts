import { expect, test } from '@playwright/test'
import { CREATOR_EMAIL, CREATOR_PASSWORD } from '../env'
import { loginViaUi } from '../support/rbac'

// Set by e2e/global-setup.ts after seeding the e2e database.
const applicationId = process.env.E2E_APPLICATION_ID

const NOT_CONFIGURED_MESSAGE =
  'AI translation is not configured for this application. Add an AI API key in the application settings.'

// Error-path-only coverage for the AI-assisted translation generation feature
// (TranslationPicker's sparkle "Generate ... with AI" action ->
// AiGenerateTranslationDialog -> POST /content/:id/translations/generate).
// Deliberately not mocking OpenAI: the seeded e2e application has no
// ApplicationSetting (so no aiApiKey), which makes aiTranslationService.ts
// deterministically 400 with the "not configured" message below before it
// would ever reach the OpenAI network call — this exercises the full real
// UI -> HTTP round trip without touching the live API or a mock server.
test.describe('AI-assisted translation generation', () => {
  test('surfaces the "not configured" error and leaves no draft behind', async ({ page }) => {
    const title = `AI Source Article ${Date.now()}`

    // ── Create a persisted Content item with one translation (English) —
    // the AI-generate icon only appears once the item exists server-side and
    // has at least one existing translation to generate from. ──────────────
    await page.goto(`/applications/${applicationId}/contents/create`)
    await page.getByText('Select a language to add a translation for').waitFor()
    await page.getByRole('button', { name: 'English' }).click()
    await page.getByLabel('Title').fill(title)
    await page.getByRole('button', { name: 'Create Content' }).first().click()

    await expect(page.getByRole('heading', { name: 'Edit Content' })).toBeVisible()
    await page.waitForURL('**/contents/*/edit')

    // ── Switch to "New Language" to reveal the picker for the two still-
    // unused languages (Persian, French), each with a "Generate ... with AI"
    // icon button next to the normal manual-add button. ────────────────────
    await page.getByRole('tab', { name: 'New Language' }).click()
    await page.getByText('Select a language to add a translation for').waitFor()

    await page.getByRole('button', { name: 'Generate Persian translation with AI' }).click()

    // ── Dialog: only one existing translation (English), so it's the sole,
    // pre-selected source — nothing else to pick before generating. ────────
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Generate Persian translation with AI')).toBeVisible()
    await expect(dialog.getByRole('combobox')).toHaveText('English')

    await dialog.getByRole('button', { name: 'Generate' }).click()

    await expect(dialog.getByText(NOT_CONFIGURED_MESSAGE)).toBeVisible()

    // No draft was inserted: the dialog stays open (didn't navigate away on
    // success) and no "Persian" tab was created.
    await expect(dialog).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Persian' })).toHaveCount(0)

    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).toHaveCount(0)
    await expect(page.getByText('Select a language to add a translation for')).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Persian' })).toHaveCount(0)
  })

})

// The backend deliberately allows any staff member with access to the
// application (not just app admins) to generate a translation — a plain
// WebSiteContentCreator can save only drafts, but can still use this action.
// Separate describe block so `test.use` (creator's own login session, not
// the admin storageState every other test reuses) only scopes here. Reuses
// the seeded creator account + existing RBAC login helper rather than
// building new fixture infrastructure.
test.describe('AI-assisted translation generation — content creator', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('a WebSiteContentCreator can also see and use the generate action', async ({ page }) => {
    await loginViaUi(page, CREATOR_EMAIL, CREATOR_PASSWORD)
    await page.waitForURL(`**/applications/${applicationId}/dashboard`)

    const title = `AI Creator Article ${Date.now()}`

    await page.goto(`/applications/${applicationId}/contents/create`)
    await page.getByText('Select a language to add a translation for').waitFor()
    await page.getByRole('button', { name: 'English' }).click()
    await page.getByLabel('Title').fill(title)
    await page.getByRole('button', { name: 'Create Content' }).first().click()

    await expect(page.getByRole('heading', { name: 'Edit Content' })).toBeVisible()
    await page.waitForURL('**/contents/*/edit')

    await page.getByRole('tab', { name: 'New Language' }).click()
    await page.getByText('Select a language to add a translation for').waitFor()

    await page.getByRole('button', { name: 'Generate French translation with AI' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Generate' }).click()

    await expect(dialog.getByText(NOT_CONFIGURED_MESSAGE)).toBeVisible()
  })
})

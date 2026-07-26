# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Nirvana CMS: a multi-tenant headless CMS. An **admin panel** (`client/`, React) lets staff manage
per-application Content articles and Pages built from typed sections/elements. A separate,
unauthenticated **content delivery API** (`server/src/controllers/frontendController.js`, mounted at
`/api/frontend`) serves published content to a public-facing website, scoped by an app key instead of
a login. See `server/docs/frontend-api.txt` for the full frontend API reference, `SCOPE.md` for
project scope, and `TECH_STACK.md` for the full stack breakdown.

For library/framework docs (React, Express, Mongoose, Tailwind, etc.) use Context7 (`context7-mcp`
skill / MCP tools) instead of relying on training data — it fetches current, version-accurate docs.

## Commands

Install (three separate installs — no workspaces):
```bash
npm install && npm install --prefix client && npm install --prefix server
```

Run both client + server together (root):
```bash
npm run dev            # concurrently: server on :5001, client on :5173 (Vite proxies /api and /storage to :5001)
npm run dev:server      # server only
npm run dev:client      # client only
```

Server (`server/`) — tests are plain Node ESM run under jest's experimental VM modules; **plain `npx jest`
fails** on `import`/`unstable_mockModule` syntax:
```bash
npm test                                                                         # all tests
node --experimental-vm-modules node_modules/jest/bin/jest.js tests/pageController.test.js   # single file
node --experimental-vm-modules node_modules/jest/bin/jest.js -t "rejects a component"       # by test name
```

Client (`client/`) — no unit-test runner; `test:e2e` (Playwright) drives a built/served app, not
component tests:
```bash
npm run build      # tsc -b && vite build
npm run lint        # oxlint
npm run test:e2e    # playwright, see playwright.config.ts
```

## Server architecture

- `src/app.js` builds/configures the Express app and exports `createApp()`; `src/index.js` loads env,
  connects to Mongo, calls `app.listen`. Keep this split.
- `src/controllers/*` are thin HTTP orchestration; reusable logic lives in `src/services/` and
  `src/validators/`. Content and Page controllers intentionally mirror each other's structure — extend
  the shared helper instead of duplicating it.
- `src/middleware/auth.js` — `authenticate` (JWT), `authorize`/`requireAdmin`/`requireStaff` (role
  gates), plus `userCanAccessApplication`/`userIsAppAdmin` (app-scoped checks used *inside* controllers,
  since some actions are admin-only only for certain fields, not unconditionally).
- `src/middleware/resolveFrontendApp.js` resolves `req.frontendApp`/`frontendSettings`/`langKey` from an
  app key (`?appKey=` or `x-app-key` header); every route under `frontendRoutes.js` depends on it and
  none sit behind `authenticate`.

**Data model (parent + per-language Details).** `Content`/`Page` hold fields shared across languages;
`ContentDetails`/`PageDetails` hold per-language `title`, `slug`, `status` (draft/published),
`publishedAt`, `metadata`, `sections`. Slugs are unique per `{application, langKey, slug}`; lookups
include soft-deleted rows (`isDeleted: {$in:[true,false]}`) so re-adding a removed language revives that
row. `publishedAt` is stamped by `pre('save')` on transition to `published`, preserved across
unpublishes. Every model gets soft-delete via `softDeletePlugin` (auto-injects
`{isDeleted: {$ne:true}}` unless the query already specifies it).

**Sections/elements.** `elements` is a discriminated union keyed by `elementType`
(`models/{content,page}/Elements.js`). Content and Page have **separate, non-shared** element catalogs
(`constants/elementTypes.js` vs `constants/pageElementTypes.js`). Which element combination is valid per
section/component `type` is checked in controllers against `SECTION_LAYOUTS`/`PAGE_COMPONENT_LAYOUTS`
(`validators/sectionValidators.js`), not the schema — Mongoose can't express that. A Page section is a
generic container of typed "components"; a Content section *is* one typed layout.

**List endpoints.** `getContents`/`getPages`/`getFrontendContents`/`getFrontendPages` push
filter/sort/skip/limit into MongoDB where possible. Sorting/searching by **title** forces an in-memory
fallback (`utils/paginateList.js`) since title lives on the per-language Details doc. Public list
endpoints start from `ContentDetails`/`PageDetails` (`{application, langKey, status:'published'}`) to
exclude drafts/untranslated items before the parent fetch+populate.

**Uploads.** `multer` (memory) + `sharp` (image resize/re-encode) via `utils/imageStorage.js`;
`utils/rawFileUpload.js` for video/document (stored as-is). Endpoints return a **bare filename**; the
client rebuilds the URL (`client/src/utils/mediaUrl.ts`) from `{kind, domain, filename}`. Storage is
split by domain under `server/storage/{images,videos,documents}/` (not tracked in git — add a
`.gitkeep` for any new subfolder).

**Roles.** `SuperAdmin` > `WebSiteAdmin` > `WebSiteContentCreator` > `WebsiteUser`
(`constants/roles.js`); the latter three are app-scoped. `userCanAccessApplication` (any staff role on
the app) vs `userIsAppAdmin` (SuperAdmin/WebSiteAdmin only — delete, publish status, category/tag,
homepage) are **not** equivalent. A ContentCreator can only save `status: draft`.

## Client architecture

- **UI components are shadcn/ui** (`client/src/components/ui/*` — Button, Dialog, AlertDialog,
  Sonner/toast, Badge, Table, Input, Select, Tabs, Checkbox, Switch, Avatar, DropdownMenu, Separator,
  Skeleton, Tooltip, Card, Alert). Built on Radix primitives via the single `radix-ui` package, styled
  with Tailwind v4 + `class-variance-authority`, composed with `cn()` from `lib/utils.ts`
  (clsx + tailwind-merge). **Default to an existing shadcn primitive (or add one via the shadcn CLI)
  over hand-rolled markup/plain Tailwind** for any new UI — dialogs, dropdowns, forms, tables, badges,
  toggles, toasts all have one. Domain-specific wrappers (`AdminTable`, `FormField`'s `TextField`,
  `StatusToggle`, `CollapsibleSectionHeader`, etc.) are thin compositions over these primitives, not
  competing implementations — extend them rather than reaching for raw `<button>`/`<input>`.
  Dark/light theming flows through CSS variables: `theme.ts`/`index.css`'s `--color-*` tokens are
  bridged to shadcn's semantic tokens (`--background`, `--primary`, `--border`, etc.) in `index.css`'s
  `@theme inline` block, toggled by `ThemeModeProvider` setting `data-theme` on `<html>`. Reference
  `--color-*` tokens directly (e.g. `text-(--color-text-tertiary)`) when a semantic shadcn token doesn't
  fit. `Login.tsx` is the one exception — a fixed light surface with hardcoded slate/violet Tailwind
  classes that intentionally ignores the dark/light toggle, so shadcn components there carry explicit
  override classNames instead of the default theme-variable-driven styling.
- Routing (`App.tsx`) is gated by `ProtectedRoute` (role check + app-assignment check, mirroring
  `userCanAccessApplication`). Redux holds only auth state; everything else is local/hook state.
- Content/Page editors use an **element editor registry** (`components/body/elementEditorRegistry.tsx`,
  `components/pageBody/pageElementEditorRegistry.tsx`) switching on `elementType`, mirroring the
  server's discriminators.
- **No shared package between client/server** — `constants/contentSections.ts`/`pageSections.ts`
  hand-duplicate the server's `SECTION_LAYOUTS`/`PAGE_COMPONENT_LAYOUTS` (same for `LangKey` and other
  enums). Update both sides by hand or they'll silently disagree.
- Forms (`pages/ContentForm.tsx`/`PageForm.tsx`) edit per-language drafts (`hooks/useContentDrafts.ts`/
  `usePageDrafts.ts`) and save via `hooks/useContentSave.ts`/`usePageSave.ts`, which `PUT` each changed
  language to `/content/:id/details/:langKey`, matching the server's per-language split.
- `api/client.ts`'s `request()` is the only fetch wrapper (JWT from `localStorage`, throws on non-2xx).

## Testing conventions (server)

Mock Mongoose models as plain objects via `jest.unstable_mockModule('../src/models/....js', () => ({
default: MockModel }))` *before* importing the module under test with a dynamic `await import(...)` —
static imports won't pick up the mock. Use a chainable query mock (`.sort().populate()...` resolving
via `.then`) where the code chains query builder methods; a plain `mockResolvedValue(...)` otherwise.

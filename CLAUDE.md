# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Nirvana CMS: a multi-tenant headless CMS. An **admin panel** (`client/`, React) lets staff manage
per-application Content articles and Pages built from typed sections/elements. A separate,
unauthenticated **content delivery API** (`server/src/controllers/frontendController.js`, mounted at
`/api/frontend`) serves published content to a public-facing website, scoped by an app key instead of
a login. See `server/docs/frontend-api.txt` for the full frontend API reference.

Stack: MongoDB/Mongoose, Express (ESM), JWT auth, multer + sharp for uploads — React 19, Vite,
TypeScript, Tailwind CSS 4, Redux Toolkit, react-router-dom, TipTap (rich text), dnd-kit (drag/drop
section reordering).

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

Server (`server/`):
```bash
npm test                                                                         # all tests
node --experimental-vm-modules node_modules/jest/bin/jest.js tests/pageController.test.js   # single file
node --experimental-vm-modules node_modules/jest/bin/jest.js -t "rejects a component"       # by test name
```
Tests are plain Node ESM run under jest's experimental VM modules (see `test` script and
`jest.config.mjs`) — there's no babel/ts transform step, and **plain `npx jest` will fail** on the
`import`/`unstable_mockModule` syntax; always go through the `--experimental-vm-modules` invocation
above (or `npm test -- <args>` to pass jest args through the `test` script).

Client (`client/`):
```bash
npm run build      # tsc -b && vite build
npm run lint        # oxlint
npm run test:e2e    # playwright — builds and serves the app first, see playwright.config.ts
```
There is no client unit-test runner; `test:e2e` is the only client test command, and it drives a
built/served app in a real browser (Playwright), not component tests.

## Server architecture

- `src/app.js` builds/configures the Express app (routes, middleware, error handler) and exports
  `createApp()`; `src/index.js` loads env, connects to Mongo, and calls `app.listen`. Keep this split —
  don't fold startup logic back into `app.js`.
- `src/controllers/*` are thin HTTP orchestration: parse the request, call a validator/service, shape
  the response. Reusable logic lives in `src/services/` (e.g. `getAllowedLanguages`,
  `findAvailableDetailSlug`, `attachDetailsToParents`) and `src/validators/` (section shape checks,
  cross-application id checks). When adding to a controller, check whether the logic is already
  shared/shareable before inlining it — Content and Page controllers intentionally mirror each other's
  structure (see below) and duplicating a helper instead of extending the shared one drifts them apart.
- `src/middleware/auth.js` — `authenticate` (JWT), `authorize`/`requireAdmin`/`requireStaff` (role
  gates), plus `userCanAccessApplication`/`userIsAppAdmin` (application-scoped permission checks used
  *inside* controllers, not just as route middleware, since many actions are admin-only only when they
  touch categories/tags/status rather than unconditionally).
- `src/middleware/resolveFrontendApp.js` — resolves `req.frontendApp`/`frontendSettings`/`langKey` from
  an app key (`?appKey=` or `x-app-key` header); every route under `frontendRoutes.js` depends on it
  and none of them sit behind `authenticate`.

### Data model: parent + per-language Details

Content and Page both split into a parent doc + a per-language "Details" doc, and the two follow the
same shape deliberately:

- `Content` / `Page` hold fields shared across every language translation (categories/tags on Content;
  `isHomepage` on Page).
- `ContentDetails` / `PageDetails` hold everything per-language: `title`, `slug`, `status`
  (draft/published), `publishedAt`, `metadata` (SEO), and `sections` (the actual body). Slugs are unique
  per `{application, langKey, slug}`; a translation is looked up including soft-deleted rows
  (`isDeleted: {$in:[true,false]}`) so re-adding a previously removed language revives that row instead
  of colliding on the unique index. `publishedAt` is stamped by a `pre('save')` hook whenever `status`
  transitions to `published`, and preserved across later unpublishes.
- Every model gets soft-delete via `softDeletePlugin` (`utils/softDeletePlugin.js`): adds `isDeleted`
  and auto-injects `{isDeleted: {$ne:true}}` into finds unless the query already specifies `isDeleted`.

### Sections/elements: Mongoose discriminators + controller-level shape validation

A section's `elements` array is a **discriminated union** keyed by `elementType`
(`discriminatorKey: 'elementType'` on `elementBaseSchema` in `models/{content,page}/Elements.js`, with
per-type schemas attached via `.path('elements').discriminator(key, schema)`). Content and Page have
**separate, non-shared element catalogs** (`constants/elementTypes.js` vs `constants/pageElementTypes.js`)
— they look similar but are different systems.

What Mongoose *can't* express — which combination of element types/counts is valid for a given section
`type` (Content) or component `type` (Page) — is checked in the controller against
`SECTION_LAYOUTS`/`PAGE_COMPONENT_LAYOUTS` (`validators/sectionValidators.js`), not in the schema. A
Page section itself is a generic, type-less container of "components" (each with its own
`{type, elements}`); a Content section *is* one typed layout. If a layout ever needs genuinely different
*fields* rather than just a different element composition, the intended extension point is giving
sections their own discriminators the same way elements do (see the comment in `models/content/Section.js`).

### List endpoints: MongoDB-side pagination where the sort field allows it

`getContents`/`getPages` (admin) and `getFrontendContents`/`getFrontendPages` (public) push
filter/sort/skip/limit into MongoDB when possible. The one thing that forces an in-memory fallback
(`utils/paginateList.js`) is sorting/searching by **title** — title lives per-language on the Details
doc, not on the parent, so it can't be expressed as a plain Mongo sort without an aggregation join.
Public list endpoints start the query from `ContentDetails`/`PageDetails`
(`{application, langKey, status: 'published'}`) rather than from `Content`/`Page`, so drafts and
untranslated items are excluded before the (more expensive) parent fetch+populate.

### Uploads

`multer` (memory storage) + `sharp` (image re-encode/resize) via `utils/imageStorage.js` and
`utils/rawFileUpload.js` (video/document, stored as-is). Upload endpoints return a **bare filename**,
not a URL — the client reconstructs a displayable URL itself (`client/src/utils/mediaUrl.ts`) from
`{kind, domain, filename}`, since it already knows kind/domain from which upload function it called.
Storage is split by domain (`content`/`page` in code, `contents`/`pages` on disk — see
`utils/mediaDomain.js`'s `DOMAIN_FOLDER`) under `server/storage/{images,videos,documents}/`. Generated
files aren't tracked in git (`.gitignore` excludes `server/storage/**` except `.gitkeep`); if you add a
new upload subfolder, add a `.gitkeep` so the directory survives a fresh clone.

### Roles

`SuperAdmin` (global, no `applications`) > `WebSiteAdmin` > `WebSiteContentCreator` > `WebsiteUser`, all
in `constants/roles.js`. The latter three are application-scoped (`APP_SCOPED_ROLES`, enforced in
`User`'s `pre('validate')`). Two permission checks recur throughout controllers and are *not*
equivalent: `userCanAccessApplication` (SuperAdmin, or any staff role assigned to the app — read/most
writes) vs `userIsAppAdmin` (SuperAdmin or WebSiteAdmin only — delete, publish/unpublish status changes,
category/tag assignment, homepage changes). A ContentCreator can create/edit content but only as
`draft`; changing `status` to anything else requires `userIsAppAdmin`.

## Client architecture

- Routing (`App.tsx`) is a single tree gated by `ProtectedRoute` (role check +, for `/applications/:id/*`,
  a check that the logged-in staff user is actually assigned to that application — mirrors the server's
  `userCanAccessApplication`). Redux (`store/`) holds only auth state; everything else is local
  component state or custom hooks (`hooks/`) — there's no global data-fetching cache layer.
- Content/Page editors follow an **element editor registry** pattern mirroring the server's
  discriminators: `components/body/elementEditorRegistry.tsx` (Content) and
  `components/pageBody/pageElementEditorRegistry.tsx` (Page) switch on `elementType` to render the
  right per-type editor component, so section/component cards never need their own big switch statement.
- **`constants/contentSections.ts` and `constants/pageSections.ts` hand-duplicate the server's
  `SECTION_LAYOUTS`/`PAGE_COMPONENT_LAYOUTS`** (there's no shared package between client/server in this
  repo — same for `LANGUAGE_VALUES`/`LangKey` and other enums). Adding or changing a section/element type
  means updating both the server constants file *and* the matching client constants file by hand, or the
  two will silently disagree about what's valid.
- Content/Page forms (`pages/ContentForm.tsx`, `pages/PageForm.tsx`) edit **per-language drafts**
  client-side (`hooks/useContentDrafts.ts`/`usePageDrafts.ts`, a `Record<LangKey, Draft>`) and save via
  `hooks/useContentSave.ts`/`usePageSave.ts`, which `PUT` each changed language individually to
  `/content/:id/details/:langKey` (or the create-all-at-once endpoint for a brand-new item) — matching
  the server's per-language Details split.
- `api/client.ts`'s `request()` is the only fetch wrapper (JWT from `localStorage`, throws on non-2xx
  using the server's `{message}` error shape); upload helpers there return `{filename}` per the
  bare-filename convention above.

## Testing conventions (server)

Tests mock Mongoose models as plain objects with `jest.fn()` methods, registered via
`jest.unstable_mockModule('../src/models/....js', () => ({ default: MockModel }))` *before* the module
under test is imported with a dynamic `await import(...)` — static imports won't pick up the mock. A
chainable query mock (`.sort().populate()...` resolving via `.then`) is used where the code under test
chains query builder methods; a plain `mockResolvedValue(...)` is used where it doesn't. Match whichever
your code does, or the mock will throw (e.g. `.sort is not a function`) or silently not chain.

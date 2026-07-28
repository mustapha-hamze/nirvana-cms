# Tech Stack — Nirvana CMS

## Backend (`server/`)

- **Runtime/Framework** — Node.js, Express (ESM). Package manager is Bun (`bun.lock`); the runtime
  itself stays on Node because Mongoose's `bson` dependency crashes under Bun
  ([oven-sh/bun#32501](https://github.com/oven-sh/bun/issues/32501), open as of writing).
- **Database** — MongoDB with Mongoose (discriminators for typed content elements)
- **Auth** — JWT, role-based access control
- **File uploads** — Multer (memory storage) + Sharp (image processing), raw storage for video/documents
- **Testing** — Jest (ESM via `--experimental-vm-modules`)

## Admin Panel (`client/`)

- **Framework** — React 19 + TypeScript
- **Package manager / runtime** — Bun (`bun.lock`; scripts run via Bun's runtime, `client/bunfig.toml`)
- **Build tool** — Vite
- **Styling** — Tailwind CSS 4
- **State management** — Redux Toolkit (auth only; rest is local/component state)
- **Routing** — react-router-dom
- **Rich text editing** — TipTap
- **Drag & drop** — dnd-kit (section/component reordering)
- **Linting** — oxlint
- **Testing** — Playwright (e2e, built/served app)

## Architecture

- Multi-tenant: single admin panel manages multiple client **Applications**
- Separate unauthenticated **content delivery API** (`/api/frontend`) scoped by app key
- No shared package between client/server — constants/enums are hand-mirrored on both sides

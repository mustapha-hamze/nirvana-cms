import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import { fileURLToPath } from 'url'
import type { Request, Response, NextFunction } from 'express'
import authRoutes from './routes/authRoutes.js'
import applicationRoutes from './routes/applicationRoutes.js'
import userRoutes from './routes/userRoutes.js'
import contentRoutes from './routes/contentRoutes.js'
import pageRoutes from './routes/pageRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'
import tagRoutes from './routes/tagRoutes.js'
import frontendRoutes from './routes/frontendRoutes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Comma-separated list of allowed origins (e.g. "https://admin.example.com,
// https://example.com"). Unset in development (including local dev via the
// Vite proxy) reflects the request's own origin. In production, leaving it
// unset is almost always an oversight rather than an intentional choice —
// fail closed instead of silently reflecting any origin.
if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGIN) {
  throw new Error('CORS_ORIGIN must be set in production')
}
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : true

// .env.example ships JWT_SECRET as a well-known placeholder — if that value
// (or anything unset/short) ever reaches production, anyone can forge valid
// staff/SuperAdmin JWTs. Fail closed the same way the CORS_ORIGIN check
// above does, rather than silently accepting a weak or default secret.
const JWT_SECRET_PLACEHOLDER = 'change-me-to-a-long-random-string'
if (process.env.NODE_ENV === 'production') {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret || jwtSecret === JWT_SECRET_PLACEHOLDER || jwtSecret.length < 32) {
    throw new Error(
      'JWT_SECRET must be set to a strong, unique value (at least 32 characters, not the .env.example placeholder) in production',
    )
  }

  // Refresh tokens are signed with their own secret (see authController.ts)
  // specifically so that leaking one secret doesn't compromise the other
  // token type — a refresh secret that's unset, weak, or identical to
  // JWT_SECRET defeats that separation.
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET
  if (
    !jwtRefreshSecret ||
    jwtRefreshSecret === JWT_SECRET_PLACEHOLDER ||
    jwtRefreshSecret.length < 32 ||
    jwtRefreshSecret === jwtSecret
  ) {
    throw new Error(
      'JWT_REFRESH_SECRET must be set to a strong, unique value (at least 32 characters, different from JWT_SECRET, not the .env.example placeholder) in production',
    )
  }
}

// Uploaded images/videos/documents live under UUID filenames that never get
// reused for different content, so a fetched file can be cached "forever"
// without ever going stale.
const STORAGE_CACHE_CONTROL = 'public, max-age=31536000, immutable'

export function createApp() {
  const app = express()

  // Trust exactly one hop: the nginx reverse proxy in front of this
  // container (see client/nginx.conf), which sets X-Forwarded-For. Without
  // this, req.ip always resolves to nginx's own address, and
  // express-rate-limit's default per-IP key generator throws
  // ERR_ERL_UNEXPECTED_X_FORWARDED_FOR on every request through
  // authRateLimiter as soon as it sees that header with trust proxy unset.
  app.set('trust proxy', 1)

  // `crossOriginResourcePolicy` overrides helmet's default `same-origin`:
  // both /api/frontend and /storage are deliberately meant to be loaded by
  // a separate, unauthenticated public-facing website (see frontendRoutes.ts
  // and CLAUDE.md) — the default would block that site's <img> tags and
  // fetches from loading this origin's responses at all.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
  // Admin-panel-only CORS policy, locked to CORS_ORIGIN — overridden below
  // for /api/frontend and /storage, which need a different, more permissive
  // policy (see publicCors).
  app.use(cors({ origin: corsOrigin }))
  app.use(express.json({ limit: '2mb' }))

  // /api/frontend and /storage are deliberately meant to be called
  // cross-origin by separate, arbitrary public-facing websites — one per
  // tenant application, each on its own domain (see CLAUDE.md,
  // resolveFrontendApp.ts) — not just this admin panel's own origin. Both
  // are app-key-scoped rather than session/cookie-based, so origin: true
  // (reflect whatever Origin the request sent) carries none of the
  // credentialed-request risk it would for an authenticated route. Mounted
  // as its own middleware per path so it runs *after* (and so overrides,
  // for these two paths only) the CORS_ORIGIN-restricted cors() above.
  const publicCors = cors({ origin: true })

  app.use(
    '/storage',
    publicCors,
    express.static(path.resolve(__dirname, '../storage'), {
      setHeaders: (res) => {
        res.setHeader('Cache-Control', STORAGE_CACHE_CONTROL)
        // Stops browsers from MIME-sniffing a served file into a more
        // dangerous type than the one we stored/served it as (e.g. treating
        // an uploaded document as HTML and executing embedded script).
        res.setHeader('X-Content-Type-Options', 'nosniff')
      },
    }),
  )

  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/applications', applicationRoutes)
  app.use('/api/users', userRoutes)
  app.use('/api/content', contentRoutes)
  app.use('/api/pages', pageRoutes)
  app.use('/api/categories', categoryRoutes)
  app.use('/api/tags', tagRoutes)
  app.use('/api/frontend', publicCors, frontendRoutes)

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const status = err.status || 500
    const message = status < 500 ? err.message : 'Internal server error'
    if (status >= 500) console.error(err)
    res.status(status).json({ message })
  })

  return app
}

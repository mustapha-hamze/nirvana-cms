import express from 'express'
import cors from 'cors'
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

// Uploaded images/videos/documents live under UUID filenames that never get
// reused for different content, so a fetched file can be cached "forever"
// without ever going stale.
const STORAGE_CACHE_CONTROL = 'public, max-age=31536000, immutable'

export function createApp() {
  const app = express()

  app.use(cors({ origin: corsOrigin }))
  app.use(express.json({ limit: '2mb' }))

  app.use(
    '/storage',
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
  app.use('/api/frontend', frontendRoutes)

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const status = err.status || 500
    const message = status < 500 ? err.message : 'Internal server error'
    if (status >= 500) console.error(err)
    res.status(status).json({ message })
  })

  return app
}

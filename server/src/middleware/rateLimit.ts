import rateLimit from 'express-rate-limit'

// Throttles brute-force attempts against credential-checking endpoints.
// Keyed by IP (express-rate-limit's default) since login/password-change
// requests aren't authenticated yet when this runs. Only enforced in
// production — a no-op elsewhere so local dev/test runs aren't rate-limited
// by repeated logins (e.g. hot-reload, test suites hitting the route directly).
export const authRateLimiter =
  process.env.NODE_ENV === 'production'
    ? rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 10,
        standardHeaders: true,
        legacyHeaders: false,
        message: { message: 'Too many attempts. Please try again later.' },
      })
    : (req: any, res: any, next: () => void) => next()

// Throttles the public, unauthenticated content-delivery API (/api/frontend
// — no login, scoped only by ?appKey=) against scraping/enumeration and
// cheap Mongo-load DoS. Much higher limit than authRateLimiter since this is
// expected to serve real public site traffic, not just credential checks.
// Same production-only gating, for the same reason (dev/test/e2e runs
// shouldn't be throttled).
export const frontendRateLimiter =
  process.env.NODE_ENV === 'production'
    ? rateLimit({
        windowMs: 60 * 1000,
        limit: 120,
        standardHeaders: true,
        legacyHeaders: false,
        message: { message: 'Too many requests. Please try again later.' },
      })
    : (req: any, res: any, next: () => void) => next()

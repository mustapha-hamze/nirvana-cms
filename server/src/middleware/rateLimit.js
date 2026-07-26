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
    : (req, res, next) => next()

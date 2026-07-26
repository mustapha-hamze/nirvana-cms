import rateLimit from 'express-rate-limit'

// Throttles brute-force attempts against credential-checking endpoints.
// Keyed by IP (express-rate-limit's default) since login/password-change
// requests aren't authenticated yet when this runs.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again later.' },
})

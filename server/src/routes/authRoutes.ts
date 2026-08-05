import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { authRateLimiter } from '../middleware/rateLimit.js'
import { login, me, changePassword, refresh, logout } from '../controllers/authController.js'

const router = Router()

router.post('/login', authRateLimiter, login)
// Not behind `authenticate` — the whole point is to mint a new access token
// once the old one has expired, and logout must still work with only an
// (expired-or-not) refresh token in hand.
router.post('/refresh', authRateLimiter, refresh)
router.post('/logout', logout)
router.get('/me', authenticate, me)
router.patch('/password', authenticate, authRateLimiter, changePassword)

export default router

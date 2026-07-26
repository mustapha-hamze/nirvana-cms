import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { authRateLimiter } from '../middleware/rateLimit.js'
import { login, me, changePassword } from '../controllers/authController.js'

const router = Router()

router.post('/login', authRateLimiter, login)
router.get('/me', authenticate, me)
router.patch('/password', authenticate, authRateLimiter, changePassword)

export default router

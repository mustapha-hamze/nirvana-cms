import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { login, me, changePassword } from '../controllers/authController.js'

const router = Router()

router.post('/login', login)
router.get('/me', authenticate, me)
router.patch('/password', authenticate, changePassword)

export default router

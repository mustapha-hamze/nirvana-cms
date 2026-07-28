import { Router } from 'express'
import { authenticate, requireSuperAdmin } from '../middleware/auth.js'
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  assignApplication,
  unassignApplication,
} from '../controllers/userController.js'

const router = Router()

router.use(authenticate, requireSuperAdmin)

router.get('/', getUsers)
router.get('/:id', getUser)
router.post('/', createUser)
router.put('/:id', updateUser)
router.patch('/:id/status', updateUserStatus)
router.delete('/:id', deleteUser)
router.patch('/:id/application', assignApplication)
router.delete('/:id/application/:appId', unassignApplication)

export default router

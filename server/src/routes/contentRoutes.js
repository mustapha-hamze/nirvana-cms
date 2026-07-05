import { Router } from 'express'
import { authenticate, requireStaff } from '../middleware/auth.js'
import { contentImageUploadMiddleware } from '../utils/contentImageUpload.js'
import {
  getContents,
  getContent,
  createContent,
  updateContent,
  deleteContent,
  upsertContentDetails,
  deleteContentDetails,
  uploadContentImage,
} from '../controllers/contentController.js'

const router = Router()

router.use(authenticate, requireStaff)

router.get('/', getContents)
router.post('/', createContent)
// Registered before '/:id' so the literal 'images' path isn't swallowed as an :id.
router.post('/images', contentImageUploadMiddleware, uploadContentImage)
router.get('/:id', getContent)
router.put('/:id', updateContent)
router.delete('/:id', deleteContent)
router.put('/:id/details/:langKey', upsertContentDetails)
router.delete('/:id/details/:langKey', deleteContentDetails)

export default router

import { Router } from 'express'
import { authenticate, requireStaff } from '../middleware/auth.js'
import { contentImageUploadMiddleware } from '../utils/contentImageUpload.js'
import { videoUploadMiddleware, documentUploadMiddleware } from '../utils/rawFileUpload.js'
import {
  getContents,
  getContent,
  createContent,
  updateContent,
  deleteContent,
  upsertContentDetails,
  deleteContentDetails,
  generateContentTranslation,
  uploadContentImage,
  uploadContentVideo,
  uploadContentDocument,
} from '../controllers/contentController.js'

const router = Router()

router.use(authenticate, requireStaff)

router.get('/', getContents)
router.post('/', createContent)
// Registered before '/:id' so these literal paths aren't swallowed as an :id.
router.post('/images', contentImageUploadMiddleware, uploadContentImage)
router.post('/videos', videoUploadMiddleware, uploadContentVideo)
router.post('/documents', documentUploadMiddleware, uploadContentDocument)
router.get('/:id', getContent)
router.put('/:id', updateContent)
router.delete('/:id', deleteContent)
router.put('/:id/details/:langKey', upsertContentDetails)
router.delete('/:id/details/:langKey', deleteContentDetails)
router.post('/:id/translations/generate', generateContentTranslation)

export default router

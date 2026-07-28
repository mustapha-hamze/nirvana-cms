// Thin page-domain wrapper around the shared image storage logic in
// imageStorage.js — keeps page uploads under storage/images/page, separate
// from content uploads (storage/images/content, see contentImageUpload.js).
import { imageUploadMiddleware, saveImage } from './imageStorage.js'

export const pageImageUploadMiddleware = imageUploadMiddleware

export function savePageImage(buffer: Buffer, mimetype: string) {
  return saveImage(buffer, mimetype, 'page')
}

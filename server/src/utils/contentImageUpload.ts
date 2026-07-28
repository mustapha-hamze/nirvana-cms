// Thin content-domain wrapper around the shared image storage logic in
// imageStorage.js — keeps content uploads under storage/images/content,
// separate from page uploads (storage/images/page, see pageImageUpload.js).
import { imageUploadMiddleware, saveImage } from './imageStorage.js'

export const contentImageUploadMiddleware = imageUploadMiddleware

export function saveContentImage(buffer: Buffer, mimetype: string) {
  return saveImage(buffer, mimetype, 'content')
}

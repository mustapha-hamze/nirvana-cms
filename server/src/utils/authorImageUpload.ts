// Thin author-domain wrapper around the shared image storage logic in
// imageStorage.js — keeps author avatars under storage/images/authors,
// separate from content/page uploads (see contentImageUpload.js).
import { imageUploadMiddleware, saveImage } from './imageStorage.js'

export const authorImageUploadMiddleware = imageUploadMiddleware

export function saveAuthorImage(buffer: Buffer, mimetype: string) {
  return saveImage(buffer, mimetype, 'author')
}

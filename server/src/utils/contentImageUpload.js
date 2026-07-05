import multer from 'multer'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const STORAGE_ROOT = path.resolve(__dirname, '../../storage/images/content')

const MAX_BYTES = 1 * 1024 * 1024 // 1MB

const EXTENSION_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
  fileFilter(req, file, cb) {
    if (!Object.prototype.hasOwnProperty.call(EXTENSION_BY_MIME, file.mimetype)) {
      return cb(Object.assign(new Error('Image must be PNG, JPEG, WEBP, or GIF'), { status: 400 }))
    }
    cb(null, true)
  },
}).single('image')

// Wraps multer's callback-style middleware so a file-too-large rejection
// (which multer raises itself, not via fileFilter) becomes a clean 400
// instead of falling through to the generic 500 handler in index.js.
export function contentImageUploadMiddleware(req, res, next) {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return next(Object.assign(new Error('Image must be smaller than 1MB'), { status: 400 }))
    }
    if (err) return next(err)
    next()
  })
}

// No per-content/per-application folder structure — a section's images can be
// uploaded before the content item itself has been saved for the first time
// (e.g. while still filling out the "Create Content" form), so there's no
// reliable id to nest under. Filenames are random, so flat storage is fine.
export async function saveContentImage(buffer, mimetype) {
  // Confirms the buffer actually decodes as an image, not just a file with a
  // spoofed extension/mimetype header.
  try {
    await sharp(buffer).metadata()
  } catch {
    throw Object.assign(new Error('File is not a valid image'), { status: 400 })
  }

  const filename = `${crypto.randomUUID()}${EXTENSION_BY_MIME[mimetype] ?? ''}`
  await fs.mkdir(STORAGE_ROOT, { recursive: true })
  await fs.writeFile(path.join(STORAGE_ROOT, filename), buffer)

  return `/storage/images/content/${filename}`
}

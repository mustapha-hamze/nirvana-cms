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

// Content/page editors upload straight from a camera or export tool, which
// routinely means several thousand pixels wide — far more than any section
// layout ever displays. Downscaling (never upscaling) to this ceiling keeps
// stored files reasonable without a visible quality loss at display size.
const MAX_DIMENSION = 2000
const JPEG_QUALITY = 82
const WEBP_QUALITY = 82

// Re-encodes at a reasonable quality without changing format/extension — a
// separate resize-and-convert-everything-to-one-format pipeline would be a
// bigger behavioral change (every URL would gain a new extension) than this
// warrants for a v1 optimization pass.
function encodeForMimetype(pipeline, mimetype) {
  switch (mimetype) {
    case 'image/jpeg':
      return pipeline.jpeg({ quality: JPEG_QUALITY }).toBuffer()
    case 'image/webp':
      return pipeline.webp({ quality: WEBP_QUALITY }).toBuffer()
    case 'image/png':
      return pipeline.png({ compressionLevel: 9 }).toBuffer()
    case 'image/gif':
      // sharp re-encodes (and, combined with the `animated: true` read option
      // below, preserves) every frame here — still meaningfully smaller once
      // oversized frames are downscaled.
      return pipeline.gif().toBuffer()
    default:
      return pipeline.toBuffer()
  }
}

// No per-content/per-application folder structure — a section's images can be
// uploaded before the content item itself has been saved for the first time
// (e.g. while still filling out the "Create Content" form), so there's no
// reliable id to nest under. Filenames are random, so flat storage is fine.
export async function saveContentImage(buffer, mimetype) {
  // `animated: true` makes sharp read (and later resize/encode) every frame
  // of a GIF instead of just the first — without it, an animated upload would
  // silently come out as a single still frame.
  const readOptions = mimetype === 'image/gif' ? { animated: true } : undefined

  let image
  try {
    image = sharp(buffer, readOptions)
    // Confirms the buffer actually decodes as an image, not just a file with
    // a spoofed extension/mimetype header.
    const metadata = await image.metadata()
    if (!metadata.width || !metadata.height) throw new Error('no dimensions')
  } catch {
    throw Object.assign(new Error('File is not a valid image'), { status: 400 })
  }

  const pipeline = image
    .rotate() // auto-orients using EXIF before resizing, then drops the tag
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
  const optimized = await encodeForMimetype(pipeline, mimetype)

  const filename = `${crypto.randomUUID()}${EXTENSION_BY_MIME[mimetype] ?? ''}`
  await fs.mkdir(STORAGE_ROOT, { recursive: true })
  await fs.writeFile(path.join(STORAGE_ROOT, filename), optimized)

  return `/storage/images/content/${filename}`
}

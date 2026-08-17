// Menu category/item images have stricter requirements (PNG only, capped at
// 1024x1024 and 512KB) than the general content/page pipeline in
// imageStorage.ts (multiple formats, 2000px ceiling, 2MB cap) — a separate
// pipeline here avoids overloading that one with a second set of limits, same
// precedent as rawFileUpload.ts being its own module rather than a branch of
// imageStorage.ts. Storage layout/domain naming still goes through the same
// DOMAIN_FOLDER convention (mediaDomain.ts) so both pipelines agree on folder
// names.
import multer from 'multer'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import type { Request, Response, NextFunction } from 'express'
import { DOMAIN_FOLDER, type MediaDomain } from './mediaDomain.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const STORAGE_ROOT = path.resolve(__dirname, '../../storage/images')

export const MENU_IMAGE_MAX_BYTES = 512 * 1024 // 512KB
const MENU_IMAGE_MAX_DIMENSION = 1024

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MENU_IMAGE_MAX_BYTES },
  fileFilter(req, file, cb) {
    if (file.mimetype !== 'image/png') {
      return cb(Object.assign(new Error('Image must be PNG'), { status: 400 }))
    }
    cb(null, true)
  },
}).single('image')

// Mirrors imageUploadMiddleware's MulterError -> clean 400 wrapping.
export function menuImageUploadMiddleware(req: Request, res: Response, next: NextFunction) {
  upload(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return next(Object.assign(new Error('Image must be smaller than 512KB'), { status: 400 }))
    }
    if (err) return next(err)
    next()
  })
}

type MenuImageDomain = Extract<MediaDomain, 'menuCategory' | 'menuItem'>

// Returns just the bare filename, not a path/URL — same contract as
// imageStorage.ts's saveImage (see its comment for why).
export async function saveMenuImage(buffer: Buffer, mimetype: string, domain: MenuImageDomain) {
  if (mimetype !== 'image/png') {
    throw Object.assign(new Error('Image must be PNG'), { status: 400 })
  }

  let image: ReturnType<typeof sharp>
  try {
    image = sharp(buffer)
    // Confirms the buffer actually decodes as a PNG, not just a file with a
    // spoofed extension/mimetype header.
    const metadata = await image.metadata()
    if (!metadata.width || !metadata.height) throw new Error('no dimensions')
  } catch {
    throw Object.assign(new Error('File is not a valid image'), { status: 400 })
  }

  const optimized = await image
    .resize({
      width: MENU_IMAGE_MAX_DIMENSION,
      height: MENU_IMAGE_MAX_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .png({ compressionLevel: 9 })
    .toBuffer()

  // Re-checked after resize/re-encode rather than relying solely on multer's
  // upload-size limit — re-encoding at max compression can't make a file
  // that was already near the limit shrink further in every case.
  if (optimized.length > MENU_IMAGE_MAX_BYTES) {
    throw Object.assign(new Error('Image must be a PNG no larger than 512KB'), { status: 400 })
  }

  const filename = `${crypto.randomUUID()}.png`
  const dir = path.join(STORAGE_ROOT, DOMAIN_FOLDER[domain])
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, filename), optimized)

  return filename
}

export function saveMenuCategoryImage(buffer: Buffer, mimetype: string) {
  return saveMenuImage(buffer, mimetype, 'menuCategory')
}

export function saveMenuItemImage(buffer: Buffer, mimetype: string) {
  return saveMenuImage(buffer, mimetype, 'menuItem')
}

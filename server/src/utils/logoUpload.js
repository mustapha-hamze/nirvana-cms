import multer from 'multer'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const STORAGE_ROOT = path.resolve(__dirname, '../../storage/images/applications')

const MAX_BYTES = 300 * 1024  // 300 KB
const REQUIRED_SIZE = 1024

export const logoUploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
  fileFilter(req, file, cb) {
    if (file.mimetype !== 'image/png') {
      return cb(Object.assign(new Error('Logo must be a PNG file'), { status: 400 }))
    }
    cb(null, true)
  },
}).single('logo')

export async function saveApplicationLogo(applicationId, buffer) {
  const metadata = await sharp(buffer).metadata()

  if (metadata.width !== REQUIRED_SIZE || metadata.height !== REQUIRED_SIZE) {
    const err = new Error('Logo must be exactly 1024×1024 pixels')
    err.status = 400
    throw err
  }

  const dir = path.join(STORAGE_ROOT, applicationId.toString())
  await fs.mkdir(dir, { recursive: true })

  const dest = path.join(dir, 'logo.png')
  await sharp(buffer).png().toFile(dest)

  return `/storage/images/applications/${applicationId}/logo.png`
}

export async function deleteApplicationLogo(applicationId) {
  const dir = path.join(STORAGE_ROOT, applicationId.toString())
  await fs.rm(dir, { recursive: true, force: true })
}

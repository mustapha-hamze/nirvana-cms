// Shared video/document upload plumbing — unlike images (imageStorage.js),
// these are stored as-is with no processing, just validated and written to
// storage/{videos|documents}/{contents|pages}. One multer instance and one
// save function per kind, reused by both the content and page domains (only
// the destination subfolder varies — see DOMAIN_FOLDER).
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import { DOMAIN_FOLDER } from './mediaDomain.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const STORAGE_ROOT = path.resolve(__dirname, '../../storage')

const VIDEO_MAX_BYTES = 50 * 1024 * 1024 // 50MB
const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024 // 10MB

const VIDEO_EXTENSION_BY_MIME = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
}

const DOCUMENT_EXTENSION_BY_MIME = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
}

// `file.mimetype` in fileFilter is just the client-supplied Content-Type
// header — trivially spoofable — and multer's memoryStorage doesn't expose
// the buffer until after upload, so it can't be checked there. This checks
// the actual bytes once we have them, before anything is written to disk.
// .docx is a zip container (PK\x03\x04) like a generic zip, not something we
// can distinguish from other zip-based formats by magic bytes alone — this
// still catches a file that isn't a zip/OLE2/box-container at all.
const MAGIC_BYTES_BY_MIME = {
  'application/pdf': (buf) => buf.subarray(0, 5).toString('latin1') === '%PDF-',
  'application/msword': (buf) =>
    buf.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])),
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': (buf) =>
    buf.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])),
  'video/mp4': (buf) => buf.subarray(4, 8).toString('latin1') === 'ftyp',
  'video/quicktime': (buf) =>
    ['ftyp', 'moov', 'mdat', 'wide', 'skip', 'free'].includes(buf.subarray(4, 8).toString('latin1')),
  'video/webm': (buf) => buf.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])),
}

const KIND_CONFIG = {
  video: {
    fieldName: 'video',
    folder: 'videos',
    extensionByMime: VIDEO_EXTENSION_BY_MIME,
    maxBytes: VIDEO_MAX_BYTES,
    typeErrorMessage: 'Video must be MP4, WebM, or MOV',
    sizeErrorMessage: 'Video must be smaller than 50MB',
  },
  document: {
    fieldName: 'document',
    folder: 'documents',
    extensionByMime: DOCUMENT_EXTENSION_BY_MIME,
    maxBytes: DOCUMENT_MAX_BYTES,
    typeErrorMessage: 'Document must be PDF, DOC, or DOCX',
    sizeErrorMessage: 'Document must be smaller than 10MB',
  },
}

function buildUploadMiddleware(kind) {
  const config = KIND_CONFIG[kind]
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: config.maxBytes },
    fileFilter(req, file, cb) {
      if (!Object.prototype.hasOwnProperty.call(config.extensionByMime, file.mimetype)) {
        return cb(Object.assign(new Error(config.typeErrorMessage), { status: 400 }))
      }
      cb(null, true)
    },
  }).single(config.fieldName)

  // Same callback-wrapping convention as imageStorage.js's imageUploadMiddleware
  // — turns multer's own file-too-large rejection into a clean 400.
  return function rawFileUploadMiddleware(req, res, next) {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return next(Object.assign(new Error(config.sizeErrorMessage), { status: 400 }))
      }
      if (err) return next(err)
      next()
    })
  }
}

export const videoUploadMiddleware = buildUploadMiddleware('video')
export const documentUploadMiddleware = buildUploadMiddleware('document')

// domain: 'content' | 'page'. No content validation beyond mimetype
// whitelisting (unlike images, there's no equivalent of re-encoding/resizing
// a video or document) — the buffer is written to disk as-is.
//
// Returns just the bare filename, not a path/URL — that's what's stored in
// the database (see models/content/Elements.js's urlField). The admin
// panel reconstructs a displayable URL from {kind, domain, filename} itself
// (client/src/utils/mediaUrl.ts), since it already knows kind/domain from
// which upload field triggered the request.
async function saveRawFile(kind, buffer, mimetype, domain) {
  const config = KIND_CONFIG[kind]
  const looksLikeDeclaredType = MAGIC_BYTES_BY_MIME[mimetype]?.(buffer)
  if (!looksLikeDeclaredType) {
    throw Object.assign(new Error(config.typeErrorMessage), { status: 400 })
  }
  const filename = `${crypto.randomUUID()}${config.extensionByMime[mimetype] ?? ''}`
  const dir = path.join(STORAGE_ROOT, config.folder, DOMAIN_FOLDER[domain])
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, filename), buffer)
  return filename
}

export function saveVideo(buffer, mimetype, domain) {
  return saveRawFile('video', buffer, mimetype, domain)
}

export function saveDocument(buffer, mimetype, domain) {
  return saveRawFile('document', buffer, mimetype, domain)
}

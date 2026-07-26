import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { uploadContentVideo, uploadPageVideo, uploadPageDocument } from '../../api/client'
import { resolveMediaUrl } from '../../utils/mediaUrl'

const KIND_CONFIG = {
  video: {
    accept: 'video/mp4,video/webm,video/quicktime',
    hint: 'MP4, WEBM, or MOV — up to 50MB.',
    maxBytes: 50 * 1024 * 1024,
    tooLargeMessage: 'Video must be smaller than 50MB',
  },
  document: {
    accept: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    hint: 'PDF, DOC, or DOCX — up to 10MB.',
    maxBytes: 10 * 1024 * 1024,
    tooLargeMessage: 'Document must be smaller than 10MB',
  },
} as const

// Sibling to ImageUploadField for the two other self-hosted file kinds — a
// video is never processed server-side (see rawFileUpload.js), just
// validated and stored, so this has no image-style preview, only a link to
// the uploaded file.
export default function FileUploadField({
  applicationId,
  kind,
  domain,
  url,
  onUploaded,
  label,
}: {
  applicationId: string
  kind: 'video' | 'document'
  domain: 'content' | 'page'
  url: string
  onUploaded: (url: string) => void
  label?: string
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const config = KIND_CONFIG[kind]

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file to re-upload/replace
    if (!file) return
    if (file.size > config.maxBytes) {
      setError(config.tooLargeMessage)
      return
    }
    setError('')
    setUploading(true)
    try {
      // Content has no document-bearing element yet, so there's no
      // uploadContentDocument client function to pick here — only the
      // three combinations an editor can actually reach.
      const upload = domain === 'content' ? uploadContentVideo : kind === 'video' ? uploadPageVideo : uploadPageDocument
      const { filename } = await upload(applicationId, file)
      onUploaded(filename)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <Label className="mb-1.5 text-sm font-medium text-muted-foreground">
        {label ?? (kind === 'video' ? 'Upload video' : 'Upload document')}{' '}
        {uploading && <span className="text-(--color-text-tertiary)">— uploading…</span>}
      </Label>
      <Input
        type="file"
        accept={config.accept}
        onChange={handleFileChange}
        disabled={uploading}
        className="h-auto py-1.5"
      />
      <p className="text-xs mt-1 text-(--color-text-tertiary)">
        {config.hint}
      </p>
      {error && (
        <p className="text-xs mt-1 text-destructive">
          {error}
        </p>
      )}
      {url && (
        <a
          href={resolveMediaUrl(kind === 'video' ? 'videos' : 'documents', domain, url)}
          target="_blank"
          rel="noreferrer"
          className="block text-xs mt-2 truncate text-primary underline"
        >
          {url}
        </a>
      )}
    </div>
  )
}

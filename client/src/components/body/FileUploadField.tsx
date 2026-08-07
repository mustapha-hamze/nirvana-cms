import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { uploadContentVideo, uploadPageVideo, uploadPageDocument } from '../../api/client'
import { resolveMediaUrl } from '../../utils/mediaUrl'
import { useLocale } from '../../i18n/useLocale'
import type { TranslationKey } from '../../i18n/types'

const KIND_CONFIG: Record<'video' | 'document', {
  accept: string
  hintKey: TranslationKey
  maxBytes: number
  tooLargeKey: TranslationKey
}> = {
  video: {
    accept: 'video/mp4,video/webm,video/quicktime',
    hintKey: 'contentBuilder.videoFormatsHint',
    maxBytes: 50 * 1024 * 1024,
    tooLargeKey: 'contentBuilder.videoTooLarge',
  },
  document: {
    accept: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    hintKey: 'contentBuilder.documentFormatsHint',
    maxBytes: 10 * 1024 * 1024,
    tooLargeKey: 'contentBuilder.documentTooLarge',
  },
}

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
  const { t } = useLocale()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const config = KIND_CONFIG[kind]

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file to re-upload/replace
    if (!file) return
    if (file.size > config.maxBytes) {
      setError(t(config.tooLargeKey))
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
      setError(err instanceof Error ? err.message : t('contentBuilder.uploadFailed'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <Label className="mb-1.5 text-sm font-medium text-muted-foreground">
        {label ?? (kind === 'video' ? t('contentBuilder.uploadVideo') : t('contentBuilder.uploadDocument'))}{' '}
        {uploading && <span className="text-(--color-text-tertiary)">{t('contentBuilder.uploadingSuffix')}</span>}
      </Label>
      <Input
        type="file"
        accept={config.accept}
        onChange={handleFileChange}
        disabled={uploading}
        className="h-auto py-1.5"
      />
      <p className="text-xs mt-1 text-(--color-text-tertiary)">
        {t(config.hintKey)}
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

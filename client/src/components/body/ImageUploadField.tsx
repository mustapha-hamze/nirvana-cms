import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { uploadContentImage, uploadPageImage } from '../../api/client'
import { resolveMediaUrl } from '../../utils/mediaUrl'
import { useLocale } from '../../i18n/useLocale'

const MAX_BYTES = 2 * 1024 * 1024

export default function ImageUploadField({
  applicationId,
  url,
  onUploaded,
  label,
  // Which editor domain this upload belongs to — determines storage location
  // server-side (storage/images/content vs storage/images/page). Defaults to
  // 'content' since that's this shared component's original/majority caller;
  // every pageBody/* usage passes 'page' explicitly.
  domain = 'content',
}: {
  applicationId: string
  url: string
  onUploaded: (url: string) => void
  label?: string
  domain?: 'content' | 'page'
}) {
  const { t } = useLocale()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file to re-upload/replace
    if (!file) return
    if (file.size > MAX_BYTES) {
      setError(t('contentBuilder.imageTooLarge'))
      return
    }
    setError('')
    setUploading(true)
    try {
      const upload = domain === 'page' ? uploadPageImage : uploadContentImage
      // `url` prop/onUploaded value is really "whatever's stored" — a bare
      // filename for a fresh upload here, or (for existing data) a full URL;
      // resolveMediaUrl below is what turns either into something <img> can load.
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
        {label ?? t('contentBuilder.elementImage')} {uploading && <span className="text-(--color-text-tertiary)">{t('contentBuilder.uploadingSuffix')}</span>}
      </Label>
      <Input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleFileChange}
        disabled={uploading}
        className="h-auto py-1.5"
      />
      <p className="text-xs mt-1 text-(--color-text-tertiary)">
        {t('contentBuilder.imageFormatsHint')}
      </p>
      {error && (
        <p className="text-xs mt-1 text-destructive">
          {error}
        </p>
      )}
      {url && (
        // Keyed by url so a fresh <img> mounts per upload — otherwise a
        // previous broken-image load's hidden state would stick around.
        <div className="mt-2 rounded-xl overflow-hidden border">
          <img key={url} src={resolveMediaUrl('images', domain, url)} alt="" className="w-full max-h-48 object-cover" />
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { uploadContentImage, uploadPageImage, uploadAuthorImage, uploadMenuCategoryImage, uploadMenuItemImage } from '../../api/client'
import { resolveMediaUrl } from '../../utils/mediaUrl'
import { useLocale } from '../../i18n/useLocale'

const MAX_BYTES = 2 * 1024 * 1024
// Menu images have their own, stricter server-side pipeline (PNG only,
// 1024x1024, 512KB) — the client-side pre-check mirrors that cap instead of
// the general 2MB one so a too-large menu image is rejected immediately
// rather than after a round trip to the server.
const MENU_MAX_BYTES = 512 * 1024

const UPLOAD_BY_DOMAIN = {
  content: uploadContentImage,
  page: uploadPageImage,
  author: uploadAuthorImage,
  menuCategory: uploadMenuCategoryImage,
  menuItem: uploadMenuItemImage,
} as const

type ImageDomain = keyof typeof UPLOAD_BY_DOMAIN

export default function ImageUploadField({
  applicationId,
  url,
  onUploaded,
  label,
  // Which editor domain this upload belongs to — determines storage location
  // server-side (storage/images/content vs storage/images/page vs
  // storage/images/authors vs storage/images/menu/{categories|items}).
  // Defaults to 'content' since that's this shared component's original/
  // majority caller; every pageBody/* usage passes 'page' explicitly,
  // AuthorModal passes 'author', and Menu category/item modals pass
  // 'menuCategory'/'menuItem'.
  domain = 'content',
}: {
  applicationId: string
  url: string
  onUploaded: (url: string) => void
  label?: string
  domain?: ImageDomain
}) {
  const { t } = useLocale()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const isMenuDomain = domain === 'menuCategory' || domain === 'menuItem'
  const maxBytes = isMenuDomain ? MENU_MAX_BYTES : MAX_BYTES

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file to re-upload/replace
    if (!file) return
    if (file.size > maxBytes) {
      setError(isMenuDomain ? t('contentBuilder.menuImageTooLarge') : t('contentBuilder.imageTooLarge'))
      return
    }
    setError('')
    setUploading(true)
    try {
      // `url` prop/onUploaded value is really "whatever's stored" — a bare
      // filename for a fresh upload here, or (for existing data) a full URL;
      // resolveMediaUrl below is what turns either into something <img> can load.
      const { filename } = await UPLOAD_BY_DOMAIN[domain](applicationId, file)
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
        accept={isMenuDomain ? 'image/png' : 'image/png,image/jpeg,image/webp,image/gif'}
        onChange={handleFileChange}
        disabled={uploading}
        className="h-auto py-1.5"
      />
      <p className="text-xs mt-1 text-(--color-text-tertiary)">
        {isMenuDomain ? t('contentBuilder.menuImageFormatsHint') : t('contentBuilder.imageFormatsHint')}
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

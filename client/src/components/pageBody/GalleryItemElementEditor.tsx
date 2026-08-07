import { TextField, TextAreaField, SelectField } from '../ui/FormField'
import ImageUploadField from '../body/ImageUploadField'
import FileUploadField from '../body/FileUploadField'
import type { GalleryItemElement } from '../../types/page'
import { GALLERY_MEDIA_TYPE_VALUES, GALLERY_MEDIA_TYPE_KEYS } from '../../constants/pageSections'
import { useLocale } from '../../i18n/useLocale'

// One shape covers all three media kinds — only which fields are shown
// changes, not the underlying element (see galleryItemSchema on the server).
export default function GalleryItemElementEditor({
  applicationId,
  element,
  onChange,
}: {
  applicationId: string
  element: GalleryItemElement
  onChange: (next: GalleryItemElement) => void
}) {
  const { t } = useLocale()
  const MEDIA_TYPE_OPTIONS = GALLERY_MEDIA_TYPE_VALUES.map((value) => ({ value, label: t(GALLERY_MEDIA_TYPE_KEYS[value]) }))
  return (
    <div className="space-y-3">
      <SelectField
        label={t('pageBuilder.mediaType')}
        value={element.mediaType}
        onChange={(mediaType) => onChange({ ...element, mediaType })}
        options={MEDIA_TYPE_OPTIONS}
      />

      {element.mediaType === 'image' ? (
        <>
          <ImageUploadField domain="page" applicationId={applicationId} url={element.url} onUploaded={(url) => onChange({ ...element, url })} />
          <TextField label={t('contentBuilder.altText')} value={element.alt} onChange={(alt) => onChange({ ...element, alt })} />
        </>
      ) : (
        <>
          <TextField
            label={element.mediaType === 'video' ? t('contentBuilder.videoUrl') : t('pageBuilder.documentUrl')}
            required
            value={element.url}
            onChange={(url) => onChange({ ...element, url })}
            placeholder={element.mediaType === 'video' ? t('pageBuilder.videoUrlPlaceholderShort') : t('pageBuilder.documentUrlPlaceholder')}
          />
          <p className="text-xs -mt-1.5 text-(--color-text-tertiary)">
            {t('pageBuilder.uploadFileHint')}
          </p>
          <FileUploadField
            applicationId={applicationId}
            kind={element.mediaType === 'video' ? 'video' : 'document'}
            domain="page"
            url={element.url}
            onUploaded={(url) => onChange({ ...element, url })}
          />
          {element.mediaType === 'document' && (
            <TextField
              label={t('pageBuilder.fileName')}
              value={element.fileName}
              onChange={(fileName) => onChange({ ...element, fileName })}
              placeholder={t('pageBuilder.fileNamePlaceholder')}
            />
          )}
          <ImageUploadField
            domain="page"
            label={t('pageBuilder.thumbnailImage')}
            applicationId={applicationId}
            url={element.thumbnailUrl}
            onUploaded={(thumbnailUrl) => onChange({ ...element, thumbnailUrl })}
          />
        </>
      )}

      <TextAreaField label={t('contentBuilder.caption')} value={element.caption} onChange={(caption) => onChange({ ...element, caption })} rows={2} />
    </div>
  )
}

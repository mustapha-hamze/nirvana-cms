import { TextField, TextAreaField } from '../ui/FormField'
import ImageUploadField from '../body/ImageUploadField'
import { useLocale } from '../../i18n/useLocale'
import type { ImageElement } from '../../types/page'

export default function ImageElementEditor({
  applicationId,
  element,
  onChange,
}: {
  applicationId: string
  element: ImageElement
  onChange: (next: ImageElement) => void
}) {
  const { t } = useLocale()
  return (
    <div className="space-y-3">
      <ImageUploadField domain="page" applicationId={applicationId} url={element.url} onUploaded={(url) => onChange({ ...element, url })} />
      <TextField
        label={t('contentBuilder.altText')}
        required
        value={element.alt}
        onChange={(alt) => onChange({ ...element, alt })}
        placeholder={t('contentBuilder.altTextPlaceholder')}
      />
      <TextAreaField label={t('contentBuilder.caption')} value={element.caption} onChange={(caption) => onChange({ ...element, caption })} rows={2} />
    </div>
  )
}

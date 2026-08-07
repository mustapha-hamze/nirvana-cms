import { TextField } from '../ui/FormField'
import ImageUploadField from '../body/ImageUploadField'
import { useLocale } from '../../i18n/useLocale'
import type { CarouselItemElement } from '../../types/page'

export default function CarouselItemElementEditor({
  applicationId,
  element,
  onChange,
}: {
  applicationId: string
  element: CarouselItemElement
  onChange: (next: CarouselItemElement) => void
}) {
  const { t } = useLocale()
  return (
    <div className="space-y-3">
      <ImageUploadField domain="page" applicationId={applicationId} url={element.image} onUploaded={(image) => onChange({ ...element, image })} />
      <TextField label={t('pageBuilder.imageAltText')} value={element.imageAlt} onChange={(imageAlt) => onChange({ ...element, imageAlt })} />
      <TextField label={t('contentBuilder.caption')} value={element.caption} onChange={(caption) => onChange({ ...element, caption })} />
      <TextField label={t('pageBuilder.linkOptional')} value={element.linkUrl} onChange={(linkUrl) => onChange({ ...element, linkUrl })} placeholder={t('contentBuilder.linkUrlPlaceholder')} />
    </div>
  )
}

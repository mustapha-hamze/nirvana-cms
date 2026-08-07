import { TextField, TextAreaField } from '../ui/FormField'
import ImageUploadField from '../body/ImageUploadField'
import { useLocale } from '../../i18n/useLocale'
import type { SlideElement } from '../../types/page'

export default function SlideElementEditor({
  applicationId,
  element,
  onChange,
}: {
  applicationId: string
  element: SlideElement
  onChange: (next: SlideElement) => void
}) {
  const { t } = useLocale()
  return (
    <div className="space-y-3">
      <ImageUploadField domain="page" applicationId={applicationId} url={element.image} onUploaded={(image) => onChange({ ...element, image })} />
      <TextField label={t('pageBuilder.imageAltText')} value={element.imageAlt} onChange={(imageAlt) => onChange({ ...element, imageAlt })} />
      <TextField label={t('contentBuilder.elementHeading')} value={element.heading} onChange={(heading) => onChange({ ...element, heading })} />
      <TextAreaField label={t('pageBuilder.subheading')} value={element.subheading} onChange={(subheading) => onChange({ ...element, subheading })} rows={2} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label={t('pageBuilder.buttonLabel')} value={element.ctaLabel} onChange={(ctaLabel) => onChange({ ...element, ctaLabel })} placeholder={t('pageBuilder.learnMorePlaceholder')} />
        <TextField label={t('pageBuilder.buttonLink')} value={element.ctaUrl} onChange={(ctaUrl) => onChange({ ...element, ctaUrl })} placeholder={t('contentBuilder.linkUrlPlaceholder')} />
      </div>
    </div>
  )
}

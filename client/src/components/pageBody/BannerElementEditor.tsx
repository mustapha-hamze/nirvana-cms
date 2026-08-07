import { TextField, TextAreaField } from '../ui/FormField'
import ImageUploadField from '../body/ImageUploadField'
import { useLocale } from '../../i18n/useLocale'
import type { BannerElement } from '../../types/page'

export default function BannerElementEditor({
  applicationId,
  element,
  onChange,
}: {
  applicationId: string
  element: BannerElement
  onChange: (next: BannerElement) => void
}) {
  const { t } = useLocale()
  return (
    <div className="space-y-3">
      <ImageUploadField domain="page" label={t('pageBuilder.backgroundImage')} applicationId={applicationId} url={element.image} onUploaded={(image) => onChange({ ...element, image })} />
      <TextField label={t('pageBuilder.backgroundImageAltText')} value={element.imageAlt} onChange={(imageAlt) => onChange({ ...element, imageAlt })} />
      <ImageUploadField domain="page" label={t('pageBuilder.logoOptional')} applicationId={applicationId} url={element.logo} onUploaded={(logo) => onChange({ ...element, logo })} />
      <TextField label={t('pageBuilder.logoAltText')} value={element.logoAlt} onChange={(logoAlt) => onChange({ ...element, logoAlt })} />
      <TextField label={t('contentBuilder.elementHeading')} value={element.heading} onChange={(heading) => onChange({ ...element, heading })} />
      <TextAreaField label={t('pageBuilder.subheading')} value={element.subheading} onChange={(subheading) => onChange({ ...element, subheading })} rows={2} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label={t('pageBuilder.buttonLabel')} value={element.ctaLabel} onChange={(ctaLabel) => onChange({ ...element, ctaLabel })} placeholder={t('pageBuilder.getStartedPlaceholder')} />
        <TextField label={t('pageBuilder.buttonLink')} value={element.ctaUrl} onChange={(ctaUrl) => onChange({ ...element, ctaUrl })} placeholder={t('contentBuilder.linkUrlPlaceholder')} />
      </div>
    </div>
  )
}

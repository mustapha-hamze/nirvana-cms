import { TextField, TextAreaField } from '../ui/FormField'
import ImageUploadField from '../body/ImageUploadField'
import { useLocale } from '../../i18n/useLocale'
import type { PortfolioItemElement } from '../../types/page'

export default function PortfolioItemElementEditor({
  applicationId,
  element,
  onChange,
}: {
  applicationId: string
  element: PortfolioItemElement
  onChange: (next: PortfolioItemElement) => void
}) {
  const { t } = useLocale()
  return (
    <div className="space-y-3">
      <ImageUploadField domain="page" applicationId={applicationId} url={element.image} onUploaded={(image) => onChange({ ...element, image })} />
      <TextField label={t('pageBuilder.imageAltText')} value={element.imageAlt} onChange={(imageAlt) => onChange({ ...element, imageAlt })} />
      <TextField label={t('table.title')} required value={element.title} onChange={(title) => onChange({ ...element, title })} placeholder={t('pageBuilder.titlePlaceholderBrandRedesign')} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label={t('pageBuilder.client')} value={element.client} onChange={(client) => onChange({ ...element, client })} />
        <TextField label={t('pageBuilder.category')} value={element.category} onChange={(category) => onChange({ ...element, category })} placeholder={t('pageBuilder.categoryPlaceholder')} />
      </div>
      <TextAreaField label={t('common.description')} value={element.description} onChange={(description) => onChange({ ...element, description })} rows={3} />
      <TextField label={t('pageBuilder.caseStudyLink')} value={element.caseStudyUrl} onChange={(caseStudyUrl) => onChange({ ...element, caseStudyUrl })} placeholder={t('contentBuilder.linkUrlPlaceholder')} />
    </div>
  )
}

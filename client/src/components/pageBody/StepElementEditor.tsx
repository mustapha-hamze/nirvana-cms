import { TextField, TextAreaField } from '../ui/FormField'
import ImageUploadField from '../body/ImageUploadField'
import { useLocale } from '../../i18n/useLocale'
import type { StepElement } from '../../types/page'

export default function StepElementEditor({
  applicationId,
  element,
  onChange,
}: {
  applicationId: string
  element: StepElement
  onChange: (next: StepElement) => void
}) {
  const { t } = useLocale()
  return (
    <div className="space-y-3">
      <TextField label={t('table.title')} required value={element.title} onChange={(title) => onChange({ ...element, title })} placeholder={t('pageBuilder.titlePlaceholderCreateAccount')} />
      <TextAreaField label={t('common.description')} value={element.description} onChange={(description) => onChange({ ...element, description })} rows={2} />
      <ImageUploadField domain="page" applicationId={applicationId} url={element.icon} onUploaded={(icon) => onChange({ ...element, icon })} />
    </div>
  )
}

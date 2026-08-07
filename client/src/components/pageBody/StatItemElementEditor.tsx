import { TextField } from '../ui/FormField'
import ImageUploadField from '../body/ImageUploadField'
import { useLocale } from '../../i18n/useLocale'
import type { StatItemElement } from '../../types/page'

export default function StatItemElementEditor({
  applicationId,
  element,
  onChange,
}: {
  applicationId: string
  element: StatItemElement
  onChange: (next: StatItemElement) => void
}) {
  const { t } = useLocale()
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <TextField label={t('pageBuilder.valueLabel')} required value={element.value} onChange={(value) => onChange({ ...element, value })} placeholder={t('pageBuilder.valuePlaceholder')} />
        <TextField label={t('contentBuilder.label')} required value={element.label} onChange={(label) => onChange({ ...element, label })} placeholder={t('pageBuilder.happyCustomersPlaceholder')} />
      </div>
      <ImageUploadField domain="page" applicationId={applicationId} url={element.icon} onUploaded={(icon) => onChange({ ...element, icon })} />
    </div>
  )
}

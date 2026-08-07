import { TextField, TextAreaField } from '../ui/FormField'
import { useLocale } from '../../i18n/useLocale'
import type { TimelineItemElement } from '../../types/page'

export default function TimelineItemElementEditor({
  element,
  onChange,
}: {
  element: TimelineItemElement
  onChange: (next: TimelineItemElement) => void
}) {
  const { t } = useLocale()
  return (
    <div className="space-y-3">
      <TextField label={t('pageBuilder.date')} required value={element.date} onChange={(date) => onChange({ ...element, date })} placeholder={t('pageBuilder.datePlaceholder')} />
      <TextField label={t('table.title')} required value={element.title} onChange={(title) => onChange({ ...element, title })} placeholder={t('pageBuilder.titlePlaceholderCompanyFounded')} />
      <TextAreaField label={t('common.description')} value={element.description} onChange={(description) => onChange({ ...element, description })} rows={3} />
    </div>
  )
}

import { TextField } from '../ui/FormField'
import RichTextArea from './RichTextArea'
import { useLocale } from '../../i18n/useLocale'
import type { TabElement } from '../../types/page'

export default function TabElementEditor({
  element,
  onChange,
}: {
  element: TabElement
  onChange: (next: TabElement) => void
}) {
  const { t } = useLocale()
  return (
    <div className="space-y-3">
      <TextField label={t('pageBuilder.tabLabel')} required value={element.label} onChange={(label) => onChange({ ...element, label })} placeholder={t('pageBuilder.tabLabelPlaceholder')} />
      <RichTextArea label={t('pageBuilder.tabContent')} html={element.content} onChange={(content) => onChange({ ...element, content })} />
    </div>
  )
}

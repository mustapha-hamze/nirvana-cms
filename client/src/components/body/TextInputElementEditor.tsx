import { TextField } from '../ui/FormField'
import { useLocale } from '../../i18n/useLocale'
import type { TextInputElement } from '../../types/content'

export default function TextInputElementEditor({
  element,
  onChange,
}: {
  element: TextInputElement
  onChange: (next: TextInputElement) => void
}) {
  const { t } = useLocale()
  return <TextField label={t('contentBuilder.text')} required value={element.text} onChange={(text) => onChange({ ...element, text })} />
}

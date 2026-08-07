import { TextAreaField } from '../ui/FormField'
import { useLocale } from '../../i18n/useLocale'
import type { ParagraphElement } from '../../types/content'

export default function ParagraphElementEditor({
  element,
  onChange,
}: {
  element: ParagraphElement
  onChange: (next: ParagraphElement) => void
}) {
  const { t } = useLocale()
  return (
    <TextAreaField
      label={t('contentBuilder.text')}
      required
      value={element.text}
      onChange={(text) => onChange({ ...element, text })}
      rows={4}
      placeholder={t('contentBuilder.paragraphPlaceholder')}
    />
  )
}

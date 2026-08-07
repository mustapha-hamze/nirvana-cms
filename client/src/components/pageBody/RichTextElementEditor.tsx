import RichTextArea from './RichTextArea'
import { useLocale } from '../../i18n/useLocale'
import type { RichTextElement } from '../../types/page'

export default function RichTextElementEditor({
  element,
  onChange,
}: {
  element: RichTextElement
  onChange: (next: RichTextElement) => void
}) {
  const { t } = useLocale()
  return <RichTextArea label={t('pageBuilder.elementTextBlock')} html={element.html} onChange={(html) => onChange({ ...element, html })} />
}

import { TextField } from '../ui/FormField'
import RichTextArea from './RichTextArea'
import { useLocale } from '../../i18n/useLocale'
import type { AccordionItemElement } from '../../types/page'

// Shared by the Accordion and FAQ components — see PAGE_COMPONENT_LAYOUTS in
// constants/pageSections.ts for why they use the same element.
export default function AccordionItemElementEditor({
  element,
  onChange,
}: {
  element: AccordionItemElement
  onChange: (next: AccordionItemElement) => void
}) {
  const { t } = useLocale()
  return (
    <div className="space-y-3">
      <TextField label={t('contentBuilder.elementHeading')} required value={element.heading} onChange={(heading) => onChange({ ...element, heading })} placeholder={t('pageBuilder.accordionHeadingPlaceholder')} />
      <RichTextArea label={t('pageBuilder.content')} html={element.content} onChange={(content) => onChange({ ...element, content })} />
    </div>
  )
}

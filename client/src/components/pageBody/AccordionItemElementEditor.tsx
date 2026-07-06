import { TextField } from '../ui/FormField'
import RichTextArea from './RichTextArea'
import type { AccordionItemElement } from '../../types/page'

// Shared by the Accordion and FAQ sections — see PAGE_SECTION_LAYOUTS in
// types/page.ts for why they use the same element.
export default function AccordionItemElementEditor({
  element,
  onChange,
}: {
  element: AccordionItemElement
  onChange: (next: AccordionItemElement) => void
}) {
  return (
    <div className="space-y-3">
      <TextField label="Heading" required value={element.heading} onChange={(heading) => onChange({ ...element, heading })} placeholder="e.g. What is your return policy?" />
      <RichTextArea label="Content" html={element.content} onChange={(content) => onChange({ ...element, content })} />
    </div>
  )
}

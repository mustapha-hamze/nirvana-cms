import RichTextArea from './RichTextArea'
import type { RichTextElement } from '../../types/page'

export default function RichTextElementEditor({
  element,
  onChange,
}: {
  element: RichTextElement
  onChange: (next: RichTextElement) => void
}) {
  return <RichTextArea label="Text Block" html={element.html} onChange={(html) => onChange({ ...element, html })} />
}

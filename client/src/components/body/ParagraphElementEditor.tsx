import { TextAreaField } from '../ui/FormField'
import type { ParagraphElement } from '../../types/content'

export default function ParagraphElementEditor({
  element,
  onChange,
}: {
  element: ParagraphElement
  onChange: (next: ParagraphElement) => void
}) {
  return (
    <TextAreaField
      label="Text"
      required
      value={element.text}
      onChange={(text) => onChange({ ...element, text })}
      rows={4}
      placeholder="Write a paragraph…"
    />
  )
}

import { TextField } from '../ui/FormField'
import type { TextInputElement } from '../../types/content'

export default function TextInputElementEditor({
  element,
  onChange,
}: {
  element: TextInputElement
  onChange: (next: TextInputElement) => void
}) {
  return <TextField label="Text" required value={element.text} onChange={(text) => onChange({ ...element, text })} />
}

import { TextField } from '../ui/FormField'
import RichTextArea from './RichTextArea'
import type { TabElement } from '../../types/page'

export default function TabElementEditor({
  element,
  onChange,
}: {
  element: TabElement
  onChange: (next: TabElement) => void
}) {
  return (
    <div className="space-y-3">
      <TextField label="Tab label" required value={element.label} onChange={(label) => onChange({ ...element, label })} placeholder="e.g. Shipping" />
      <RichTextArea label="Tab content" html={element.content} onChange={(content) => onChange({ ...element, content })} />
    </div>
  )
}

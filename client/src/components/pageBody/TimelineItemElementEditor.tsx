import { TextField, TextAreaField } from '../ui/FormField'
import type { TimelineItemElement } from '../../types/page'

export default function TimelineItemElementEditor({
  element,
  onChange,
}: {
  element: TimelineItemElement
  onChange: (next: TimelineItemElement) => void
}) {
  return (
    <div className="space-y-3">
      <TextField label="Date" required value={element.date} onChange={(date) => onChange({ ...element, date })} placeholder="e.g. 2020 or January 2020" />
      <TextField label="Title" required value={element.title} onChange={(title) => onChange({ ...element, title })} placeholder="e.g. Company founded" />
      <TextAreaField label="Description" value={element.description} onChange={(description) => onChange({ ...element, description })} rows={3} />
    </div>
  )
}

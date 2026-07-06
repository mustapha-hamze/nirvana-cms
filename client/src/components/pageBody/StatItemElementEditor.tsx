import { TextField } from '../ui/FormField'
import ImageUploadField from '../body/ImageUploadField'
import type { StatItemElement } from '../../types/page'

export default function StatItemElementEditor({
  applicationId,
  element,
  onChange,
}: {
  applicationId: string
  element: StatItemElement
  onChange: (next: StatItemElement) => void
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Value" required value={element.value} onChange={(value) => onChange({ ...element, value })} placeholder="e.g. 10K+" />
        <TextField label="Label" required value={element.label} onChange={(label) => onChange({ ...element, label })} placeholder="e.g. Happy customers" />
      </div>
      <ImageUploadField applicationId={applicationId} url={element.icon} onUploaded={(icon) => onChange({ ...element, icon })} />
    </div>
  )
}

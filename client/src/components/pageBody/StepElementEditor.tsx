import { TextField, TextAreaField } from '../ui/FormField'
import ImageUploadField from '../body/ImageUploadField'
import type { StepElement } from '../../types/page'

export default function StepElementEditor({
  applicationId,
  element,
  onChange,
}: {
  applicationId: string
  element: StepElement
  onChange: (next: StepElement) => void
}) {
  return (
    <div className="space-y-3">
      <TextField label="Title" required value={element.title} onChange={(title) => onChange({ ...element, title })} placeholder="e.g. Create an account" />
      <TextAreaField label="Description" value={element.description} onChange={(description) => onChange({ ...element, description })} rows={2} />
      <ImageUploadField domain="page" applicationId={applicationId} url={element.icon} onUploaded={(icon) => onChange({ ...element, icon })} />
    </div>
  )
}

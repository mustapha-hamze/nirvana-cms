import { TextField, TextAreaField } from '../ui/FormField'
import ImageUploadField from '../body/ImageUploadField'
import type { CardElement } from '../../types/page'

export default function CardElementEditor({
  applicationId,
  element,
  onChange,
}: {
  applicationId: string
  element: CardElement
  onChange: (next: CardElement) => void
}) {
  return (
    <div className="space-y-3">
      <ImageUploadField applicationId={applicationId} url={element.image} onUploaded={(image) => onChange({ ...element, image })} />
      <TextField label="Image alt text" value={element.imageAlt} onChange={(imageAlt) => onChange({ ...element, imageAlt })} />
      <TextField label="Title" required value={element.title} onChange={(title) => onChange({ ...element, title })} />
      <TextAreaField label="Description" value={element.description} onChange={(description) => onChange({ ...element, description })} rows={3} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Badge" value={element.badge} onChange={(badge) => onChange({ ...element, badge })} placeholder="e.g. New" />
        <TextField label="Link" value={element.ctaUrl} onChange={(ctaUrl) => onChange({ ...element, ctaUrl })} placeholder="https://…" />
      </div>
      <TextField label="Link label" value={element.ctaLabel} onChange={(ctaLabel) => onChange({ ...element, ctaLabel })} placeholder="Read more" />
    </div>
  )
}

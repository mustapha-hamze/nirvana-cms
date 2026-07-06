import { TextField, TextAreaField } from '../ui/FormField'
import ImageUploadField from '../body/ImageUploadField'
import type { SlideElement } from '../../types/page'

export default function SlideElementEditor({
  applicationId,
  element,
  onChange,
}: {
  applicationId: string
  element: SlideElement
  onChange: (next: SlideElement) => void
}) {
  return (
    <div className="space-y-3">
      <ImageUploadField applicationId={applicationId} url={element.image} onUploaded={(image) => onChange({ ...element, image })} />
      <TextField label="Image alt text" value={element.imageAlt} onChange={(imageAlt) => onChange({ ...element, imageAlt })} />
      <TextField label="Heading" value={element.heading} onChange={(heading) => onChange({ ...element, heading })} />
      <TextAreaField label="Subheading" value={element.subheading} onChange={(subheading) => onChange({ ...element, subheading })} rows={2} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Button label" value={element.ctaLabel} onChange={(ctaLabel) => onChange({ ...element, ctaLabel })} placeholder="Learn more" />
        <TextField label="Button link" value={element.ctaUrl} onChange={(ctaUrl) => onChange({ ...element, ctaUrl })} placeholder="https://…" />
      </div>
    </div>
  )
}

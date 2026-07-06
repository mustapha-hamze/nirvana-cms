import { TextField, TextAreaField } from '../ui/FormField'
import ImageUploadField from '../body/ImageUploadField'
import type { PortfolioItemElement } from '../../types/page'

export default function PortfolioItemElementEditor({
  applicationId,
  element,
  onChange,
}: {
  applicationId: string
  element: PortfolioItemElement
  onChange: (next: PortfolioItemElement) => void
}) {
  return (
    <div className="space-y-3">
      <ImageUploadField applicationId={applicationId} url={element.image} onUploaded={(image) => onChange({ ...element, image })} />
      <TextField label="Image alt text" value={element.imageAlt} onChange={(imageAlt) => onChange({ ...element, imageAlt })} />
      <TextField label="Title" required value={element.title} onChange={(title) => onChange({ ...element, title })} placeholder="e.g. Brand redesign" />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Client" value={element.client} onChange={(client) => onChange({ ...element, client })} />
        <TextField label="Category" value={element.category} onChange={(category) => onChange({ ...element, category })} placeholder="e.g. Branding" />
      </div>
      <TextAreaField label="Description" value={element.description} onChange={(description) => onChange({ ...element, description })} rows={3} />
      <TextField label="Case study link" value={element.caseStudyUrl} onChange={(caseStudyUrl) => onChange({ ...element, caseStudyUrl })} placeholder="https://…" />
    </div>
  )
}

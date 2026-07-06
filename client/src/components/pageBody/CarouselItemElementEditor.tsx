import { TextField } from '../ui/FormField'
import ImageUploadField from '../body/ImageUploadField'
import type { CarouselItemElement } from '../../types/page'

export default function CarouselItemElementEditor({
  applicationId,
  element,
  onChange,
}: {
  applicationId: string
  element: CarouselItemElement
  onChange: (next: CarouselItemElement) => void
}) {
  return (
    <div className="space-y-3">
      <ImageUploadField applicationId={applicationId} url={element.image} onUploaded={(image) => onChange({ ...element, image })} />
      <TextField label="Image alt text" value={element.imageAlt} onChange={(imageAlt) => onChange({ ...element, imageAlt })} />
      <TextField label="Caption" value={element.caption} onChange={(caption) => onChange({ ...element, caption })} />
      <TextField label="Link (optional)" value={element.linkUrl} onChange={(linkUrl) => onChange({ ...element, linkUrl })} placeholder="https://…" />
    </div>
  )
}

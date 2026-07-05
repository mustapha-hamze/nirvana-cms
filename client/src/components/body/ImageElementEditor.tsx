import { TextField, TextAreaField } from '../ui/FormField'
import ImageUploadField from './ImageUploadField'
import type { ImageElement } from '../../types/content'

export default function ImageElementEditor({
  applicationId,
  element,
  onChange,
}: {
  applicationId: string
  element: ImageElement
  onChange: (next: ImageElement) => void
}) {
  return (
    <div className="space-y-3">
      <ImageUploadField applicationId={applicationId} url={element.url} onUploaded={(url) => onChange({ ...element, url })} />
      <TextField
        label="Alt text"
        required
        value={element.alt}
        onChange={(alt) => onChange({ ...element, alt })}
        placeholder="Describe the image for accessibility"
      />
      <TextAreaField label="Caption" value={element.caption} onChange={(caption) => onChange({ ...element, caption })} rows={2} />
    </div>
  )
}

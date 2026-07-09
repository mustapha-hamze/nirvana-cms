import { TextField, TextAreaField } from '../ui/FormField'
import ImageUploadField from '../body/ImageUploadField'
import StringListField from './StringListField'
import { theme } from '../../theme'
import type { FeatureElement } from '../../types/page'

export default function FeatureElementEditor({
  applicationId,
  element,
  onChange,
}: {
  applicationId: string
  element: FeatureElement
  onChange: (next: FeatureElement) => void
}) {
  return (
    <div className="space-y-3">
      <ImageUploadField domain="page" label="Image" applicationId={applicationId} url={element.image} onUploaded={(image) => onChange({ ...element, image })} />
      <TextField label="Image alt text" value={element.imageAlt} onChange={(imageAlt) => onChange({ ...element, imageAlt })} />

      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Heading" required value={element.heading}
          onChange={(heading) => onChange({ ...element, heading })}
          placeholder="e.g. Over 118 million people around the"
        />
        <TextField
          label="Highlighted word (optional)" value={element.highlightText}
          onChange={(highlightText) => onChange({ ...element, highlightText })}
          placeholder="e.g. WORLD"
        />
      </div>
      <p className="text-xs" style={{ color: theme.textTertiary }}>
        The highlighted word is appended after the heading and shown in the accent color.
      </p>

      <TextAreaField label="Description" value={element.description} onChange={(description) => onChange({ ...element, description })} rows={3} />

      <StringListField
        label="Checklist items"
        values={element.items}
        onChange={(items) => onChange({ ...element, items })}
        placeholder="e.g. Nations Series, Nations Feature Film, Nations Music"
        max={12}
      />

      <p className="text-xs font-semibold pt-1" style={{ color: theme.textTertiary }}>Badge (optional)</p>
      <ImageUploadField domain="page" label="Badge image" applicationId={applicationId} url={element.badgeImage} onUploaded={(badgeImage) => onChange({ ...element, badgeImage })} />
      <TextField label="Badge alt text" value={element.badgeImageAlt} onChange={(badgeImageAlt) => onChange({ ...element, badgeImageAlt })} />
    </div>
  )
}

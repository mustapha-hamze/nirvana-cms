import { TextField, TextAreaField } from '../ui/FormField'
import { theme } from '../../theme'
import type { VideoEmbedElement } from '../../types/content'

export default function VideoEmbedElementEditor({
  element,
  onChange,
}: {
  element: VideoEmbedElement
  onChange: (next: VideoEmbedElement) => void
}) {
  return (
    <div className="space-y-2">
      <TextField
        label="Video URL"
        required
        value={element.url}
        onChange={(url) => onChange({ ...element, url })}
        placeholder="Paste a YouTube or Vimeo URL"
      />
      <p className="text-xs" style={{ color: theme.textTertiary }}>
        Not validated as an embeddable link server-side yet — double-check it plays before publishing.
      </p>
      <div className="pt-1">
        <TextAreaField label="Caption" value={element.caption} onChange={(caption) => onChange({ ...element, caption })} rows={2} />
      </div>
    </div>
  )
}

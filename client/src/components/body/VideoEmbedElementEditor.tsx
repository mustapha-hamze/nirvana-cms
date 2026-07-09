import { TextField, TextAreaField } from '../ui/FormField'
import { theme } from '../../theme'
import FileUploadField from './FileUploadField'
import type { VideoEmbedElement } from '../../types/content'

export default function VideoEmbedElementEditor({
  applicationId,
  element,
  onChange,
}: {
  applicationId: string
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
      <p className="text-xs" style={{ color: theme.textTertiary }}>
        Or upload a video file instead of pasting a link — it fills the same URL field above.
      </p>
      <FileUploadField
        applicationId={applicationId}
        kind="video"
        domain="content"
        url={element.url}
        onUploaded={(url) => onChange({ ...element, url })}
      />
      <div className="pt-1">
        <TextAreaField label="Caption" value={element.caption} onChange={(caption) => onChange({ ...element, caption })} rows={2} />
      </div>
    </div>
  )
}

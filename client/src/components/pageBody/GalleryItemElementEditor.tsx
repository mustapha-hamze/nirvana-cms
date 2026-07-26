import { TextField, TextAreaField, SelectField } from '../ui/FormField'
import ImageUploadField from '../body/ImageUploadField'
import FileUploadField from '../body/FileUploadField'
import type { GalleryItemElement } from '../../types/page'
import { GALLERY_MEDIA_TYPE_VALUES, GALLERY_MEDIA_TYPE_LABELS } from '../../constants/pageSections'

const MEDIA_TYPE_OPTIONS = GALLERY_MEDIA_TYPE_VALUES.map((value) => ({ value, label: GALLERY_MEDIA_TYPE_LABELS[value] }))

// One shape covers all three media kinds — only which fields are shown
// changes, not the underlying element (see galleryItemSchema on the server).
export default function GalleryItemElementEditor({
  applicationId,
  element,
  onChange,
}: {
  applicationId: string
  element: GalleryItemElement
  onChange: (next: GalleryItemElement) => void
}) {
  return (
    <div className="space-y-3">
      <SelectField
        label="Media type"
        value={element.mediaType}
        onChange={(mediaType) => onChange({ ...element, mediaType })}
        options={MEDIA_TYPE_OPTIONS}
      />

      {element.mediaType === 'image' ? (
        <>
          <ImageUploadField domain="page" applicationId={applicationId} url={element.url} onUploaded={(url) => onChange({ ...element, url })} />
          <TextField label="Alt text" value={element.alt} onChange={(alt) => onChange({ ...element, alt })} />
        </>
      ) : (
        <>
          <TextField
            label={element.mediaType === 'video' ? 'Video URL' : 'Document URL'}
            required
            value={element.url}
            onChange={(url) => onChange({ ...element, url })}
            placeholder={element.mediaType === 'video' ? 'https://youtube.com/watch?v=…' : 'https://…/brochure.pdf'}
          />
          <p className="text-xs -mt-1.5 text-(--color-text-tertiary)">
            Or upload a file below instead of pasting a link — it fills the same URL field above.
          </p>
          <FileUploadField
            applicationId={applicationId}
            kind={element.mediaType === 'video' ? 'video' : 'document'}
            domain="page"
            url={element.url}
            onUploaded={(url) => onChange({ ...element, url })}
          />
          {element.mediaType === 'document' && (
            <TextField
              label="File name"
              value={element.fileName}
              onChange={(fileName) => onChange({ ...element, fileName })}
              placeholder="e.g. Brochure.pdf"
            />
          )}
          <ImageUploadField
            domain="page"
            label="Thumbnail image"
            applicationId={applicationId}
            url={element.thumbnailUrl}
            onUploaded={(thumbnailUrl) => onChange({ ...element, thumbnailUrl })}
          />
        </>
      )}

      <TextAreaField label="Caption" value={element.caption} onChange={(caption) => onChange({ ...element, caption })} rows={2} />
    </div>
  )
}

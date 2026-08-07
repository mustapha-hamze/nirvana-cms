import { TextField, TextAreaField } from '../ui/FormField'
import FileUploadField from './FileUploadField'
import { useLocale } from '../../i18n/useLocale'
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
  const { t } = useLocale()
  return (
    <div className="space-y-2">
      <TextField
        label={t('contentBuilder.videoUrl')}
        required
        value={element.url}
        onChange={(url) => onChange({ ...element, url })}
        placeholder={t('contentBuilder.videoUrlPlaceholder')}
      />
      <p className="text-xs text-(--color-text-tertiary)">
        {t('contentBuilder.videoNotValidatedHint')}
      </p>
      <p className="text-xs text-(--color-text-tertiary)">
        {t('contentBuilder.videoUploadAltHint')}
      </p>
      <FileUploadField
        applicationId={applicationId}
        kind="video"
        domain="content"
        url={element.url}
        onUploaded={(url) => onChange({ ...element, url })}
      />
      <div className="pt-1">
        <TextAreaField label={t('contentBuilder.caption')} value={element.caption} onChange={(caption) => onChange({ ...element, caption })} rows={2} />
      </div>
    </div>
  )
}

import { TextField, TextAreaField } from '../ui/FormField'
import ImageUploadField from '../body/ImageUploadField'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useLocale } from '../../i18n/useLocale'
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
  const { t } = useLocale()
  return (
    <div className="space-y-3">
      <ImageUploadField domain="page" applicationId={applicationId} url={element.image} onUploaded={(image) => onChange({ ...element, image })} />
      <TextField label={t('pageBuilder.imageAltText')} value={element.imageAlt} onChange={(imageAlt) => onChange({ ...element, imageAlt })} />
      <TextField label={t('table.title')} required value={element.title} onChange={(title) => onChange({ ...element, title })} />
      <TextAreaField label={t('common.description')} value={element.description} onChange={(description) => onChange({ ...element, description })} rows={3} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label={t('pageBuilder.badge')} value={element.badge} onChange={(badge) => onChange({ ...element, badge })} placeholder={t('pageBuilder.badgePlaceholder')} />
        <TextField label={t('contentBuilder.elementLink')} value={element.ctaUrl} onChange={(ctaUrl) => onChange({ ...element, ctaUrl })} placeholder={t('contentBuilder.linkUrlPlaceholder')} />
      </div>
      <TextField label={t('pageBuilder.linkLabel')} value={element.ctaLabel} onChange={(ctaLabel) => onChange({ ...element, ctaLabel })} placeholder={t('contentBuilder.labelPlaceholder')} />
      <Label className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
        <Checkbox checked={element.highlighted} onCheckedChange={(checked) => onChange({ ...element, highlighted: checked === true })} />
        {t('pageBuilder.highlightCard')}
      </Label>
    </div>
  )
}

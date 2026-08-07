import { TextField, TextAreaField } from '../ui/FormField'
import ImageUploadField from '../body/ImageUploadField'
import StringListField from './StringListField'
import { useLocale } from '../../i18n/useLocale'
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
  const { t } = useLocale()
  return (
    <div className="space-y-3">
      <ImageUploadField domain="page" label={t('contentBuilder.elementImage')} applicationId={applicationId} url={element.image} onUploaded={(image) => onChange({ ...element, image })} />
      <TextField label={t('pageBuilder.imageAltText')} value={element.imageAlt} onChange={(imageAlt) => onChange({ ...element, imageAlt })} />

      <div className="grid grid-cols-2 gap-3">
        <TextField
          label={t('contentBuilder.elementHeading')} required value={element.heading}
          onChange={(heading) => onChange({ ...element, heading })}
          placeholder={t('pageBuilder.featureHeadingPlaceholder')}
        />
        <TextField
          label={t('pageBuilder.highlightedWordOptional')} value={element.highlightText}
          onChange={(highlightText) => onChange({ ...element, highlightText })}
          placeholder={t('pageBuilder.highlightedWordPlaceholder')}
        />
      </div>
      <p className="text-xs text-(--color-text-tertiary)">
        {t('pageBuilder.highlightedWordHint')}
      </p>

      <TextAreaField label={t('common.description')} value={element.description} onChange={(description) => onChange({ ...element, description })} rows={3} />

      <StringListField
        label={t('pageBuilder.checklistItems')}
        values={element.items}
        onChange={(items) => onChange({ ...element, items })}
        placeholder={t('pageBuilder.checklistItemsPlaceholder')}
        max={12}
      />

      <p className="text-xs font-semibold pt-1 text-(--color-text-tertiary)">{t('pageBuilder.badgeOptional')}</p>
      <ImageUploadField domain="page" label={t('pageBuilder.badgeImage')} applicationId={applicationId} url={element.badgeImage} onUploaded={(badgeImage) => onChange({ ...element, badgeImage })} />
      <TextField label={t('pageBuilder.badgeAltText')} value={element.badgeImageAlt} onChange={(badgeImageAlt) => onChange({ ...element, badgeImageAlt })} />
    </div>
  )
}

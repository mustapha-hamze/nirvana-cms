import { TextField, TextAreaField } from '../ui/FormField'
import { useLocale } from '../../i18n/useLocale'
import type { CtaElement } from '../../types/page'

export default function CtaElementEditor({
  element,
  onChange,
}: {
  element: CtaElement
  onChange: (next: CtaElement) => void
}) {
  const { t } = useLocale()
  return (
    <div className="space-y-3">
      <TextField label={t('contentBuilder.elementHeading')} required value={element.heading} onChange={(heading) => onChange({ ...element, heading })} placeholder={t('pageBuilder.ctaHeadingPlaceholder')} />
      <TextAreaField label={t('pageBuilder.subheading')} value={element.subheading} onChange={(subheading) => onChange({ ...element, subheading })} rows={2} />

      <div>
        <p className="text-xs font-semibold mb-1.5 text-(--color-text-tertiary)">{t('pageBuilder.primaryButton')}</p>
        <div className="grid grid-cols-2 gap-3">
          <TextField label={t('contentBuilder.label')} value={element.ctaLabel} onChange={(ctaLabel) => onChange({ ...element, ctaLabel })} placeholder={t('pageBuilder.getStartedPlaceholder')} />
          <TextField label={t('contentBuilder.elementLink')} value={element.ctaUrl} onChange={(ctaUrl) => onChange({ ...element, ctaUrl })} placeholder={t('contentBuilder.linkUrlPlaceholder')} />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold mb-1.5 text-(--color-text-tertiary)">{t('pageBuilder.secondaryButtonOptional')}</p>
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label={t('contentBuilder.label')} value={element.secondaryCtaLabel}
            onChange={(secondaryCtaLabel) => onChange({ ...element, secondaryCtaLabel })}
            placeholder={t('pageBuilder.learnMorePlaceholder')}
          />
          <TextField
            label={t('contentBuilder.elementLink')} value={element.secondaryCtaUrl}
            onChange={(secondaryCtaUrl) => onChange({ ...element, secondaryCtaUrl })}
            placeholder={t('contentBuilder.linkUrlPlaceholder')}
          />
        </div>
      </div>
    </div>
  )
}

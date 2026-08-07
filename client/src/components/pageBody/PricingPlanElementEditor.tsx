import { TextField } from '../ui/FormField'
import StringListField from './StringListField'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useLocale } from '../../i18n/useLocale'
import type { PricingPlanElement } from '../../types/page'

export default function PricingPlanElementEditor({
  element,
  onChange,
}: {
  element: PricingPlanElement
  onChange: (next: PricingPlanElement) => void
}) {
  const { t } = useLocale()
  return (
    <div className="space-y-3">
      <TextField label={t('pageBuilder.planName')} required value={element.name} onChange={(name) => onChange({ ...element, name })} placeholder={t('pageBuilder.planNamePlaceholder')} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label={t('pageBuilder.price')} value={element.price} onChange={(price) => onChange({ ...element, price })} placeholder={t('pageBuilder.pricePlaceholder')} />
        <TextField label={t('pageBuilder.billingPeriod')} value={element.billingPeriod} onChange={(billingPeriod) => onChange({ ...element, billingPeriod })} placeholder={t('pageBuilder.billingPeriodPlaceholder')} />
      </div>
      <StringListField
        label={t('pageBuilder.features')}
        values={element.features}
        onChange={(features) => onChange({ ...element, features })}
        placeholder={t('pageBuilder.featuresPlaceholder')}
        max={12}
      />
      <div className="grid grid-cols-2 gap-3">
        <TextField label={t('pageBuilder.buttonLabel')} value={element.ctaLabel} onChange={(ctaLabel) => onChange({ ...element, ctaLabel })} placeholder={t('pageBuilder.choosePlanPlaceholder')} />
        <TextField label={t('pageBuilder.buttonLink')} value={element.ctaUrl} onChange={(ctaUrl) => onChange({ ...element, ctaUrl })} placeholder={t('contentBuilder.linkUrlPlaceholder')} />
      </div>
      <Label className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
        <Checkbox checked={element.highlighted} onCheckedChange={(checked) => onChange({ ...element, highlighted: checked === true })} />
        {t('pageBuilder.highlightPlan')}
      </Label>
    </div>
  )
}

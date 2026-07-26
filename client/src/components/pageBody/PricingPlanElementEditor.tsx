import { TextField } from '../ui/FormField'
import StringListField from './StringListField'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { PricingPlanElement } from '../../types/page'

export default function PricingPlanElementEditor({
  element,
  onChange,
}: {
  element: PricingPlanElement
  onChange: (next: PricingPlanElement) => void
}) {
  return (
    <div className="space-y-3">
      <TextField label="Plan name" required value={element.name} onChange={(name) => onChange({ ...element, name })} placeholder="e.g. Pro" />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Price" value={element.price} onChange={(price) => onChange({ ...element, price })} placeholder="$29" />
        <TextField label="Billing period" value={element.billingPeriod} onChange={(billingPeriod) => onChange({ ...element, billingPeriod })} placeholder="/month" />
      </div>
      <StringListField
        label="Features"
        values={element.features}
        onChange={(features) => onChange({ ...element, features })}
        placeholder="e.g. Unlimited projects"
        max={12}
      />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Button label" value={element.ctaLabel} onChange={(ctaLabel) => onChange({ ...element, ctaLabel })} placeholder="Choose plan" />
        <TextField label="Button link" value={element.ctaUrl} onChange={(ctaUrl) => onChange({ ...element, ctaUrl })} placeholder="https://…" />
      </div>
      <Label className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
        <Checkbox checked={element.highlighted} onCheckedChange={(checked) => onChange({ ...element, highlighted: checked === true })} />
        Highlight this plan as recommended
      </Label>
    </div>
  )
}

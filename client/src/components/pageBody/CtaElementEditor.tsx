import { TextField, TextAreaField } from '../ui/FormField'
import { theme } from '../../theme'
import type { CtaElement } from '../../types/page'

export default function CtaElementEditor({
  element,
  onChange,
}: {
  element: CtaElement
  onChange: (next: CtaElement) => void
}) {
  return (
    <div className="space-y-3">
      <TextField label="Heading" required value={element.heading} onChange={(heading) => onChange({ ...element, heading })} placeholder="e.g. Ready to get started?" />
      <TextAreaField label="Subheading" value={element.subheading} onChange={(subheading) => onChange({ ...element, subheading })} rows={2} />

      <div>
        <p className="text-xs font-semibold mb-1.5" style={{ color: theme.textTertiary }}>Primary button</p>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Label" value={element.ctaLabel} onChange={(ctaLabel) => onChange({ ...element, ctaLabel })} placeholder="Get started" />
          <TextField label="Link" value={element.ctaUrl} onChange={(ctaUrl) => onChange({ ...element, ctaUrl })} placeholder="https://…" />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold mb-1.5" style={{ color: theme.textTertiary }}>Secondary button (optional)</p>
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Label" value={element.secondaryCtaLabel}
            onChange={(secondaryCtaLabel) => onChange({ ...element, secondaryCtaLabel })}
            placeholder="Learn more"
          />
          <TextField
            label="Link" value={element.secondaryCtaUrl}
            onChange={(secondaryCtaUrl) => onChange({ ...element, secondaryCtaUrl })}
            placeholder="https://…"
          />
        </div>
      </div>
    </div>
  )
}

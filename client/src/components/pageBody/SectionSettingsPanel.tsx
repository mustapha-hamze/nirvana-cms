import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  SECTION_SPACING_VALUES, SECTION_SPACING_LABELS, SECTION_WIDTH_VALUES, SECTION_WIDTH_LABELS,
  SECTION_TEXT_ALIGN_VALUES,
} from '../../constants/pageSections'
import type { SectionSettings, SectionTextAlign } from '../../types/page'

const TEXT_ALIGN_ICON: Record<SectionTextAlign, string> = { left: '⟵', center: '↔', right: '⟶' }

function PillGroup<T extends string>({
  value,
  options,
  labels,
  onChange,
}: {
  value: T
  options: readonly T[]
  labels: Record<T, string>
  onChange: (next: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const active = option === value
        return (
          <Button
            key={option}
            type="button"
            variant={active ? 'default' : 'outline'}
            size="sm"
            className="h-auto rounded-full px-3 py-1.5 text-xs"
            onClick={() => onChange(option)}
          >
            {labels[option]}
          </Button>
        )
      })}
    </div>
  )
}

// Section-level presentation controls (background/spacing/width/alignment) —
// toggled open via PageSectionCardHeader's gear button.
export default function SectionSettingsPanel({
  settings,
  onChange,
}: {
  settings: SectionSettings
  onChange: (next: SectionSettings) => void
}) {
  // A free-typed color renders fine in the native swatch only when it's a
  // hex value — anything else (a CSS name, `transparent`, blank) just falls
  // back to a neutral swatch rather than the browser rejecting the input.
  const swatchValue = /^#[0-9a-f]{6}$/i.test(settings.backgroundColor) ? settings.backgroundColor : '#0d1635'

  return (
    <div className="rounded-xl border bg-input/30 p-4 mb-3 space-y-3">
      <div>
        <Label className="mb-1.5 text-xs font-medium text-muted-foreground">
          Background color
        </Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={swatchValue}
            onChange={(e) => onChange({ ...settings, backgroundColor: e.target.value })}
            className="w-9 h-9 rounded-lg cursor-pointer shrink-0 border bg-transparent"
          />
          <Input
            value={settings.backgroundColor}
            onChange={(e) => onChange({ ...settings, backgroundColor: e.target.value })}
            placeholder="Default — e.g. #0d1635 or transparent"
            className="flex-1"
          />
        </div>
      </div>

      <div>
        <Label className="mb-1.5 text-xs font-medium text-muted-foreground">
          Spacing
        </Label>
        <PillGroup
          value={settings.spacing}
          options={SECTION_SPACING_VALUES}
          labels={SECTION_SPACING_LABELS}
          onChange={(spacing) => onChange({ ...settings, spacing })}
        />
      </div>

      <div>
        <Label className="mb-1.5 text-xs font-medium text-muted-foreground">
          Width
        </Label>
        <PillGroup
          value={settings.width}
          options={SECTION_WIDTH_VALUES}
          labels={SECTION_WIDTH_LABELS}
          onChange={(width) => onChange({ ...settings, width })}
        />
      </div>

      <div>
        <Label className="mb-1.5 text-xs font-medium text-muted-foreground">
          Text alignment
        </Label>
        <PillGroup
          value={settings.textAlign}
          options={SECTION_TEXT_ALIGN_VALUES}
          labels={TEXT_ALIGN_ICON}
          onChange={(textAlign) => onChange({ ...settings, textAlign })}
        />
      </div>
    </div>
  )
}

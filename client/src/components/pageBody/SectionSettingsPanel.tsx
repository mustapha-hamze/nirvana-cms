import { theme } from '../../theme'
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
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition"
            style={active
              ? { background: theme.accentBg, border: '1px solid rgba(124,58,237,0.5)', color: theme.accent }
              : { background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textSecondary }
            }
          >
            {labels[option]}
          </button>
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
    <div className="rounded-xl p-4 mb-3 space-y-3" style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}` }}>
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textSecondary }}>
          Background color
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={swatchValue}
            onChange={(e) => onChange({ ...settings, backgroundColor: e.target.value })}
            className="w-9 h-9 rounded-lg cursor-pointer shrink-0"
            style={{ border: `1px solid ${theme.inputBorder}`, background: 'transparent' }}
          />
          <input
            value={settings.backgroundColor}
            onChange={(e) => onChange({ ...settings, backgroundColor: e.target.value })}
            placeholder="Default — e.g. #0d1635 or transparent"
            className="flex-1 px-3 py-2 rounded-xl text-sm outline-none transition"
            style={{ background: theme.surface, border: `1px solid ${theme.inputBorder}`, color: theme.textPrimary }}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textSecondary }}>
          Spacing
        </label>
        <PillGroup
          value={settings.spacing}
          options={SECTION_SPACING_VALUES}
          labels={SECTION_SPACING_LABELS}
          onChange={(spacing) => onChange({ ...settings, spacing })}
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textSecondary }}>
          Width
        </label>
        <PillGroup
          value={settings.width}
          options={SECTION_WIDTH_VALUES}
          labels={SECTION_WIDTH_LABELS}
          onChange={(width) => onChange({ ...settings, width })}
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textSecondary }}>
          Text alignment
        </label>
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

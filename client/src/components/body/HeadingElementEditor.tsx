import { SelectField, TextField } from '../ui/FormField'
import { HEADING_LEVELS, type HeadingElement, type HeadingLevel } from '../../types/content'

const LEVEL_OPTIONS = HEADING_LEVELS.map((level) => ({ value: String(level), label: `H${level}` }))

export default function HeadingElementEditor({
  element,
  onChange,
}: {
  element: HeadingElement
  onChange: (next: HeadingElement) => void
}) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-3 items-start">
      <div className="w-20">
        <SelectField
          label="Level"
          value={String(element.level)}
          onChange={(v) => onChange({ ...element, level: Number(v) as HeadingLevel })}
          options={LEVEL_OPTIONS}
        />
      </div>
      <TextField label="Heading Text" required value={element.text} onChange={(text) => onChange({ ...element, text })} />
    </div>
  )
}

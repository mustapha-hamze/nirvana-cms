import { SelectField, TextField } from '../ui/FormField'
import { useLocale } from '../../i18n/useLocale'
import type { HeadingElement, HeadingLevel } from '../../types/content'
import { HEADING_LEVELS } from '../../constants/contentSections'

const LEVEL_OPTIONS = HEADING_LEVELS.map((level) => ({ value: String(level), label: `H${level}` }))

export default function HeadingElementEditor({
  element,
  onChange,
}: {
  element: HeadingElement
  onChange: (next: HeadingElement) => void
}) {
  const { t } = useLocale()
  return (
    <div className="grid grid-cols-[auto_1fr] gap-3 items-start">
      <div className="w-20">
        <SelectField
          label={t('contentBuilder.level')}
          value={String(element.level)}
          onChange={(v) => onChange({ ...element, level: Number(v) as HeadingLevel })}
          options={LEVEL_OPTIONS}
        />
      </div>
      <TextField label={t('contentBuilder.headingText')} required value={element.text} onChange={(text) => onChange({ ...element, text })} />
    </div>
  )
}

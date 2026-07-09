import { TextField } from './FormField'
import { LANGUAGE_LABELS, type LangKey } from '../../types/content'

// Title input for TagModal/CategoryModal — label reflects the active
// language only when there's more than one to choose from, and switches
// direction for RTL languages (Persian).
export default function TranslatedTitleField({
  allowedLanguages,
  activeLang,
  value,
  onChange,
  placeholder,
}: {
  allowedLanguages: LangKey[]
  activeLang: LangKey
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <TextField
      label={allowedLanguages.length > 1 ? `Title (${LANGUAGE_LABELS[activeLang]})` : 'Title'}
      required
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      dir={activeLang === 'fa' ? 'rtl' : 'ltr'}
    />
  )
}

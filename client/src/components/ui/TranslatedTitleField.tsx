import { TextField } from './FormField'
import { LANGUAGE_LABELS, type LangKey } from '../../types/content'
import { useLocale } from '../../i18n/useLocale'

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
  const { t } = useLocale()
  return (
    <TextField
      label={allowedLanguages.length > 1 ? `${t('table.title')} (${LANGUAGE_LABELS[activeLang]})` : t('table.title')}
      required
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      dir={activeLang === 'fa' ? 'rtl' : 'ltr'}
    />
  )
}

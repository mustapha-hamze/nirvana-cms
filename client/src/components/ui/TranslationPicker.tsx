import { theme } from '../../theme'
import { LANGUAGE_LABELS, type LangKey } from '../../types/content'

// "Select a language to add a translation for" block shown when a
// ContentForm/PageForm has no active language selected (either on first load
// of a brand-new item, or after picking "New Language").
export default function TranslationPicker({
  availableLangs,
  onPick,
}: {
  availableLangs: LangKey[]
  onPick: (lang: LangKey) => void
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm" style={{ color: theme.textSecondary }}>
        Select a language to add a translation for:
      </p>
      <div className="flex flex-wrap gap-2">
        {availableLangs.map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => onPick(lang)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition"
            style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textPrimary }}
          >
            {LANGUAGE_LABELS[lang]}
          </button>
        ))}
      </div>
    </div>
  )
}

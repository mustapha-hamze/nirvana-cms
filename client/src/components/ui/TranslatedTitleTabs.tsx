import { theme } from '../../theme'
import { LANGUAGE_LABELS, type LangKey } from '../../types/content'

// Language tab row for TagModal/CategoryModal — unlike TranslationTabs (used
// by ContentForm/PageForm), every allowed language always has a tab (there's
// no per-language add/discard here, just one title field per language), and
// the dot marks "has a title" rather than publish status.
export default function TranslatedTitleTabs({
  allowedLanguages,
  activeLang,
  titles,
  onSelect,
}: {
  allowedLanguages: LangKey[]
  activeLang: LangKey
  titles: Partial<Record<LangKey, string>>
  onSelect: (lang: LangKey) => void
}) {
  if (allowedLanguages.length <= 1) return null

  return (
    <div className="flex items-center gap-1 px-6 pt-4" style={{ borderBottom: `1px solid ${theme.border}` }}>
      {allowedLanguages.map((lang) => {
        const isActive = lang === activeLang
        const filled = !!titles[lang]?.trim()
        return (
          <button
            key={lang}
            type="button"
            onClick={() => onSelect(lang)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all -mb-px shrink-0"
            style={isActive
              ? { color: theme.textPrimary, borderBottom: '2px solid #7c3aed' }
              : { color: theme.textSecondary, borderBottom: '2px solid transparent' }
            }
          >
            {filled && <span className="w-1.5 h-1.5 rounded-full" style={{ background: theme.accent }} />}
            {LANGUAGE_LABELS[lang]}
          </button>
        )
      })}
    </div>
  )
}

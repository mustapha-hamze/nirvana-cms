import { theme } from '../../theme'
import { PlusIcon } from '../icons'
import { LANGUAGE_LABELS, type LangKey } from '../../types/content'

// Language-switcher tab row shared by ContentForm and PageForm — one tab per
// language already drafted (with a status dot), plus a "New Language" tab
// when there's still an allowed language without a draft.
export default function TranslationTabs({
  existingLangs,
  availableLangs,
  activeLang,
  drafts,
  onSelect,
}: {
  existingLangs: LangKey[]
  availableLangs: LangKey[]
  activeLang: LangKey | null
  drafts: Partial<Record<LangKey, { status: 'draft' | 'published' }>>
  onSelect: (lang: LangKey | null) => void
}) {
  return (
    <div className="flex items-center gap-1 px-6 pt-4" style={{ borderBottom: `1px solid ${theme.border}` }}>
      {existingLangs.map((lang) => {
        const active = lang === activeLang
        const langDraft = drafts[lang]
        return (
          <button
            key={lang}
            type="button"
            onClick={() => onSelect(lang)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all -mb-px shrink-0"
            style={active
              ? { color: theme.textPrimary, borderBottom: '2px solid #7c3aed' }
              : { color: theme.textSecondary, borderBottom: '2px solid transparent' }
            }
          >
            {langDraft && (
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: langDraft.status === 'published' ? theme.success : theme.textTertiary }}
              />
            )}
            {LANGUAGE_LABELS[lang]}
          </button>
        )
      })}
      {availableLangs.length > 0 && (
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all -mb-px shrink-0"
          style={activeLang === null
            ? { color: theme.textPrimary, borderBottom: '2px solid #7c3aed' }
            : { color: theme.textSecondary, borderBottom: '2px solid transparent' }
          }
        >
          <PlusIcon size={14} />
          New Language
        </button>
      )}
    </div>
  )
}

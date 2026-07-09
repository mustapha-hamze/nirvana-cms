import { theme } from '../../theme'
import { LANGUAGE_LABELS, type LangKey } from '../../types/content'

// Language pills for Contents/Pages rows — one per translation, colored by
// that translation's own publish status.
export function LanguageStatusBadges({
  details,
}: {
  details: { langKey: LangKey; status: 'draft' | 'published' }[]
}) {
  return (
    <div className="flex items-center gap-1.5">
      {details.map((d) => (
        <span
          key={d.langKey}
          title={`${LANGUAGE_LABELS[d.langKey]} — ${d.status}`}
          className="text-[11px] font-semibold px-2 py-1 rounded-full"
          style={d.status === 'published'
            ? { background: theme.successBg, color: theme.success }
            : { background: theme.subtleBg, color: theme.textSubtle }
          }
        >
          {d.langKey.toUpperCase()}
        </span>
      ))}
    </div>
  )
}

// Language pills for Tags/Categories rows — translations carry no per-language
// status (Tag/Category status is a single flag for the whole item), so every
// pill is styled the same neutral way.
export function TranslationBadges({
  translations,
}: {
  translations: { langKey: LangKey; title: string }[]
}) {
  return (
    <div className="flex items-center gap-1.5">
      {translations.map((t) => (
        <span
          key={t.langKey}
          title={t.title}
          className="text-[11px] font-semibold px-2 py-1 rounded-full"
          style={{ background: theme.subtleBg, color: theme.textSubtle }}
        >
          {t.langKey.toUpperCase()}
        </span>
      ))}
    </div>
  )
}

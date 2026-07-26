import { Badge } from '@/components/ui/badge'
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
        <Badge
          key={d.langKey}
          title={`${LANGUAGE_LABELS[d.langKey]} — ${d.status}`}
          variant={d.status === 'published' ? 'success' : 'neutral'}
          className="rounded-full text-[11px] font-semibold"
        >
          {d.langKey.toUpperCase()}
        </Badge>
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
        <Badge
          key={t.langKey}
          title={t.title}
          variant="neutral"
          className="rounded-full text-[11px] font-semibold"
        >
          {t.langKey.toUpperCase()}
        </Badge>
      ))}
    </div>
  )
}

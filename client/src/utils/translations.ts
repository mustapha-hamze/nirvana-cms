import { LANGUAGE_VALUES, type LangKey } from '../types/content'

type Translated = { langKey: LangKey; title: string }

// Picks one title to show as a preview/label (list rows, dropdown options,
// pills, …) when the viewer's own language preference isn't known — prefers
// languages in LANGUAGE_VALUES order, falling back to whatever exists first.
export function getPreviewTitle(translations: Translated[]): string {
  for (const lang of LANGUAGE_VALUES) {
    const match = translations.find((t) => t.langKey === lang)
    if (match) return match.title
  }
  return translations[0]?.title ?? '—'
}

// Same idea, but for callers that DO know which language the viewer is
// looking at (e.g. the active language tab in a content editor) — prefers
// that language's title, falling back to getPreviewTitle when this
// particular item has no translation for it.
export function getTitleForLang(translations: Translated[], preferredLang?: LangKey | null): string {
  if (preferredLang) {
    const match = translations.find((t) => t.langKey === preferredLang)
    if (match) return match.title
  }
  return getPreviewTitle(translations)
}

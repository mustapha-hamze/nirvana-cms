import { useState } from 'react'
import type { LangKey } from '../types/content'

// Like useTranslatedTitleForm (TagModal/CategoryModal), but for MenuCategory/
// MenuItem modals, which both need a per-language title AND description —
// shared here rather than duplicated twice since (unlike Category/Tag's
// title-only shape) both new modals need the exact same two-field shape.
// Status/active toggling stays outside this hook, same as
// useTranslatedTitleForm — each modal manages that with its own useState.
export function useTranslatedFieldsForm({
  allowedLanguages,
  initialTranslations,
}: {
  allowedLanguages: LangKey[]
  initialTranslations: { langKey: LangKey; title: string; description?: string }[]
}) {
  const [titles, setTitles] = useState<Partial<Record<LangKey, string>>>(() => {
    const initial: Partial<Record<LangKey, string>> = {}
    for (const t of initialTranslations) initial[t.langKey] = t.title
    return initial
  })
  const [descriptions, setDescriptions] = useState<Partial<Record<LangKey, string>>>(() => {
    const initial: Partial<Record<LangKey, string>> = {}
    for (const t of initialTranslations) initial[t.langKey] = t.description ?? ''
    return initial
  })
  const [activeLang, setActiveLang] = useState<LangKey>(initialTranslations[0]?.langKey ?? allowedLanguages[0])

  function updateTitle(lang: LangKey, value: string) {
    setTitles((prev) => ({ ...prev, [lang]: value }))
  }
  function updateDescription(lang: LangKey, value: string) {
    setDescriptions((prev) => ({ ...prev, [lang]: value }))
  }

  // Only languages that actually got a title are sent — same rule as
  // useTranslatedTitleForm's buildTranslations.
  function buildTranslations(): { langKey: LangKey; title: string; description: string }[] {
    return allowedLanguages
      .map((langKey) => ({
        langKey,
        title: (titles[langKey] ?? '').trim(),
        description: (descriptions[langKey] ?? '').trim(),
      }))
      .filter((t) => t.title)
  }

  return { titles, descriptions, activeLang, setActiveLang, updateTitle, updateDescription, buildTranslations }
}

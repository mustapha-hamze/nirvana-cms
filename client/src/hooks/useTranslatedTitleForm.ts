import { useState } from 'react'
import type { LangKey } from '../types/content'

// Shared per-language title editing state for TagModal and CategoryModal —
// both are a single form (no per-language save, unlike ContentForm/PageForm)
// that collects one title per allowed language plus a single active/inactive
// status for the whole item.
export function useTranslatedTitleForm({
  allowedLanguages,
  initialTranslations,
  initialActive,
}: {
  allowedLanguages: LangKey[]
  initialTranslations: { langKey: LangKey; title: string }[]
  initialActive: boolean
}) {
  const [titles, setTitles] = useState<Partial<Record<LangKey, string>>>(() => {
    const initial: Partial<Record<LangKey, string>> = {}
    for (const t of initialTranslations) initial[t.langKey] = t.title
    return initial
  })
  const [activeLang, setActiveLang] = useState<LangKey>(initialTranslations[0]?.langKey ?? allowedLanguages[0])
  const [active, setActive] = useState(initialActive)

  function updateTitle(lang: LangKey, value: string) {
    setTitles((prev) => ({ ...prev, [lang]: value }))
  }

  // Only languages that actually got a title are sent — an admin can leave
  // some allowed languages blank rather than being forced to fill every one.
  function buildTranslations(): { langKey: LangKey; title: string }[] {
    return allowedLanguages
      .map((langKey) => ({ langKey, title: (titles[langKey] ?? '').trim() }))
      .filter((t) => t.title)
  }

  return { titles, activeLang, setActiveLang, active, setActive, updateTitle, buildTranslations }
}

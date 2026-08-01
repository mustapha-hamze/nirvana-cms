import { useState } from 'react'
import { LANGUAGE_VALUES, type LangKey } from '../types/content'

// Shared per-language draft state for ContentForm and PageForm — both editors
// let an admin switch between a fixed set of languages, add a new one, edit
// its own draft in isolation, and discard an unsaved draft or remove an
// already-persisted translation. `TDraft` is each form's own draft shape
// (Content's includes headline/abstract/sections, Page's doesn't), so this
// only assumes it has a `status` field for the tab's status dot.
export function useTranslationDrafts<TDraft extends { status: 'draft' | 'published' }>({
  initialDrafts,
  initialActiveLang,
  emptyDraft,
  allowedLanguages,
  persistedLangs,
}: {
  initialDrafts: Partial<Record<LangKey, TDraft>>
  initialActiveLang: LangKey | null
  emptyDraft: TDraft
  allowedLanguages: LangKey[]
  persistedLangs: LangKey[]
}) {
  const [drafts, setDrafts] = useState(initialDrafts)
  const [activeLang, setActiveLang] = useState(initialActiveLang)

  const existingLangs = LANGUAGE_VALUES.filter((lang) => drafts[lang])
  const availableLangs = allowedLanguages.filter((lang) => !drafts[lang])
  const draft = (activeLang && drafts[activeLang]) || emptyDraft
  const isPersisted = (lang: LangKey | null) => lang !== null && persistedLangs.includes(lang)

  function updateActiveDraft(patch: Partial<TDraft>) {
    if (!activeLang) return
    setDrafts((prev) => ({
      ...prev,
      [activeLang]: { ...(prev[activeLang] ?? emptyDraft), ...patch },
    }))
  }

  function handleAddLanguage(lang: LangKey) {
    setDrafts((prev) => ({ ...prev, [lang]: { ...emptyDraft } }))
    setActiveLang(lang)
  }

  // Same effect as handleAddLanguage, but seeded with an AI-generated draft
  // instead of an empty one — used when the user picks "Generate with AI" on
  // TranslationPicker. The generated draft is only ever set into local state
  // here; it's still edited and saved through the exact same flow as a
  // manually-started translation.
  function setGeneratedDraft(lang: LangKey, draft: TDraft) {
    setDrafts((prev) => ({ ...prev, [lang]: draft }))
    setActiveLang(lang)
  }

  // Drops a language's draft and returns to the "pick a language" view — used
  // both for discarding an unsaved draft directly, and as the local-state half
  // of removing an already-persisted translation (after its API call succeeds).
  function handleDiscardDraft(lang: LangKey) {
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[lang]
      return next
    })
    setActiveLang(null)
  }

  return {
    drafts,
    setDrafts,
    activeLang,
    setActiveLang,
    existingLangs,
    availableLangs,
    draft,
    isPersisted,
    updateActiveDraft,
    handleAddLanguage,
    setGeneratedDraft,
    handleDiscardDraft,
  }
}

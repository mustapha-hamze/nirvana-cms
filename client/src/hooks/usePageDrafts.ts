import { useTranslationDrafts } from './useTranslationDrafts'
import { createEmptySection, withClientKeys } from '../factories/pageElements'
import type { GeneratedPageTranslation } from '../api/client'
import type { LangKey } from '../types/content'
import type { PageStatus, PageItem, PageMetadata, PageSection } from '../types/page'

export type PageDraft = {
  title: string
  status: PageStatus
  metadata: PageMetadata
  sections: PageSection[]
}

const EMPTY_METADATA: PageMetadata = { keywords: [], author: '', description: '' }

export const EMPTY_PAGE_DRAFT: PageDraft = {
  title: '',
  status: 'draft',
  metadata: EMPTY_METADATA,
  sections: [],
}

function buildInitialDrafts(page: PageItem | null): Partial<Record<LangKey, PageDraft>> {
  const drafts: Partial<Record<LangKey, PageDraft>> = {}
  if (!page) return drafts
  for (const d of page.details) {
    drafts[d.langKey] = {
      title: d.title,
      status: d.status,
      metadata: d.metadata,
      sections: withClientKeys(d.sections ?? []),
    }
  }
  return drafts
}

// Mirrors useContentDrafts for PageForm — same generic useTranslationDrafts
// underneath, own draft shape and section-array mutation helpers on top.
export function usePageDrafts({
  page,
  allowedLanguages,
  persistedLangs,
}: {
  page: PageItem | null
  allowedLanguages: LangKey[]
  persistedLangs: LangKey[]
}) {
  const translationDrafts = useTranslationDrafts<PageDraft>({
    initialDrafts: buildInitialDrafts(page),
    initialActiveLang: page?.details[0]?.langKey ?? null,
    emptyDraft: EMPTY_PAGE_DRAFT,
    allowedLanguages,
    persistedLangs,
  })
  const { draft, updateActiveDraft, setGeneratedDraft } = translationDrafts

  // Converts an AI-generated draft (api/client.ts's response shape) into this
  // form's PageDraft — same withClientKeys treatment as sections loaded from
  // the server — and inserts it as the active language's draft.
  function handleGenerateTranslation(lang: LangKey, generated: GeneratedPageTranslation) {
    setGeneratedDraft(lang, {
      title: generated.title,
      status: generated.status,
      metadata: generated.metadata,
      sections: withClientKeys(generated.sections ?? []),
    })
  }

  function handleAddSection() {
    updateActiveDraft({ sections: [...draft.sections, createEmptySection()] })
  }

  function updateSectionAt(index: number, next: PageSection) {
    const sections = draft.sections.slice()
    sections[index] = next
    updateActiveDraft({ sections })
  }

  function removeSectionAt(index: number) {
    updateActiveDraft({ sections: draft.sections.filter((_, i) => i !== index) })
  }

  function reorderSections(next: PageSection[]) {
    updateActiveDraft({ sections: next })
  }

  return { ...translationDrafts, handleAddSection, updateSectionAt, removeSectionAt, reorderSections, handleGenerateTranslation }
}

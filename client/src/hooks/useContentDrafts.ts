import { useTranslationDrafts } from './useTranslationDrafts'
import { createEmptySection, withClientKeys } from '../factories/contentElements'
import type { LangKey, ContentStatus, ContentItem, ContentMetadata, ContentSection, SectionType } from '../types/content'

export type ContentDraft = {
  title: string
  headline: string
  abstract: string
  status: ContentStatus
  metadata: ContentMetadata
  sections: ContentSection[]
}

const EMPTY_METADATA: ContentMetadata = { keywords: [], author: '', description: '' }

export const EMPTY_CONTENT_DRAFT: ContentDraft = {
  title: '',
  headline: '',
  abstract: '',
  status: 'draft',
  metadata: EMPTY_METADATA,
  sections: [],
}

function buildInitialDrafts(content: ContentItem | null): Partial<Record<LangKey, ContentDraft>> {
  const drafts: Partial<Record<LangKey, ContentDraft>> = {}
  if (!content) return drafts
  for (const d of content.details) {
    drafts[d.langKey] = {
      title: d.title,
      headline: d.headline,
      abstract: d.abstract,
      status: d.status,
      metadata: d.metadata,
      sections: withClientKeys(d.sections ?? []),
    }
  }
  return drafts
}

// Wraps the generic useTranslationDrafts with ContentForm's own draft shape
// and section-array mutation helpers (add/update/remove/reorder), which
// PageForm's usePageDrafts mirrors for PageSection instead.
//
// `content` seeds the initial drafts/active language (read once, on mount —
// it's the prop passed in when the editor opens). `persistedLangs` is passed
// separately because it must stay reactive to `savedContent`, which is
// updated in place after each save so a language added and saved this session
// immediately counts as persisted without a page reload.
export function useContentDrafts({
  content,
  allowedLanguages,
  persistedLangs,
}: {
  content: ContentItem | null
  allowedLanguages: LangKey[]
  persistedLangs: LangKey[]
}) {
  const translationDrafts = useTranslationDrafts<ContentDraft>({
    initialDrafts: buildInitialDrafts(content),
    initialActiveLang: content?.details[0]?.langKey ?? null,
    emptyDraft: EMPTY_CONTENT_DRAFT,
    allowedLanguages,
    persistedLangs,
  })
  const { draft, updateActiveDraft } = translationDrafts

  function handleAddSection(type: SectionType) {
    updateActiveDraft({ sections: [...draft.sections, createEmptySection(type)] })
  }

  function updateSectionAt(index: number, next: ContentSection) {
    const sections = draft.sections.slice()
    sections[index] = next
    updateActiveDraft({ sections })
  }

  function removeSectionAt(index: number) {
    updateActiveDraft({ sections: draft.sections.filter((_, i) => i !== index) })
  }

  function reorderSections(next: ContentSection[]) {
    updateActiveDraft({ sections: next })
  }

  return { ...translationDrafts, handleAddSection, updateSectionAt, removeSectionAt, reorderSections }
}

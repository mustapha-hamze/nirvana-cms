import { useState } from 'react'
import { api } from '../api/client'
import { useToast } from '../components/ui/useToast'
import { toPersistableSections } from '../factories/contentElements'
import type { LangKey, ContentItem, ContentDetail } from '../types/content'
import type { ContentDraft } from './useContentDrafts'

export function useContentSave({
  applicationId,
  canManage,
  savedContent,
  setSavedContent,
  selectedCategoryIds,
  selectedTagIds,
  onCreated,
}: {
  applicationId: string
  canManage: boolean
  savedContent: ContentItem | null
  setSavedContent: (updater: (prev: ContentItem | null) => ContentItem | null) => void
  selectedCategoryIds: string[]
  selectedTagIds: string[]
  onCreated: (created: ContentItem) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { showToast } = useToast()
  const isEdit = savedContent !== null

  async function handleSave(drafts: Partial<Record<LangKey, ContentDraft>>) {
    setError('')
    const entries = (Object.entries(drafts) as [LangKey, ContentDraft][]).filter(([, d]) => d.title.trim())
    if (entries.length === 0) {
      setError('At least one language needs a title')
      showToast('At least one language needs a title', 'error')
      return
    }
    setLoading(true)
    try {
      if (savedContent) {
        // Category/tag assignment is admin-only server-side — a ContentCreator
        // can't call this endpoint at all, so skip it entirely rather than send a
        // request that would 403 and fail the whole save.
        const [updatedContent, updatedDetails] = await Promise.all([
          canManage
            ? api.put<ContentItem>(`/content/${savedContent._id}`, {
                categories: selectedCategoryIds,
                tags: selectedTagIds,
              })
            : null,
          Promise.all(
            entries.map(([langKey, d]) =>
              api.put<ContentDetail>(
                `/content/${savedContent._id}/details/${langKey}`,
                { ...d, sections: toPersistableSections(d.sections) },
              ),
            ),
          ),
        ])
        setSavedContent((prev) => {
          if (!prev) return prev
          const byLang = new Map(prev.details.map((d) => [d.langKey, d]))
          for (const d of updatedDetails) byLang.set(d.langKey, d)
          return {
            ...prev,
            categories: updatedContent ? updatedContent.categories : prev.categories,
            tags: updatedContent ? updatedContent.tags : prev.tags,
            details: [...byLang.values()],
          }
        })
        showToast('Content has been updated')
      } else {
        const created = await api.post<ContentItem>('/content', {
          application: applicationId,
          categories: selectedCategoryIds,
          tags: selectedTagIds,
          details: entries.map(([langKey, d]) => ({
            langKey,
            ...d,
            sections: toPersistableSections(d.sections),
          })),
        })
        showToast('Content has been created')
        onCreated(created)
        return
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to ${isEdit ? 'save' : 'create'} content`
      setError(message)
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, handleSave, isEdit }
}

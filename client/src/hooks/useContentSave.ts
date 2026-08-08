import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '../api/client'
import { toPersistableSections } from '../factories/contentElements'
import { useLocale } from '../i18n/useLocale'
import type { LangKey, ContentItem, ContentDetail } from '../types/content'
import type { ContentDraft } from './useContentDrafts'

export function useContentSave({
  applicationId,
  canManage,
  savedContent,
  setSavedContent,
  selectedCategoryIds,
  selectedTagIds,
  selectedAuthorId,
  onCreated,
}: {
  applicationId: string
  canManage: boolean
  savedContent: ContentItem | null
  setSavedContent: (updater: (prev: ContentItem | null) => ContentItem | null) => void
  selectedCategoryIds: string[]
  selectedTagIds: string[]
  selectedAuthorId: string
  onCreated: (created: ContentItem) => void
}) {
  const { t } = useLocale()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const isEdit = savedContent !== null

  async function handleSave(drafts: Partial<Record<LangKey, ContentDraft>>) {
    setError('')
    const entries = (Object.entries(drafts) as [LangKey, ContentDraft][]).filter(([, d]) => d.title.trim())
    if (entries.length === 0) {
      setError(t('validation.atLeastOneLanguageTitle'))
      toast.error(t('validation.atLeastOneLanguageTitle'))
      return
    }
    setLoading(true)
    try {
      if (savedContent) {
        // Category/tag/author assignment is admin-only server-side — a
        // ContentCreator can't call this endpoint at all, so skip it entirely
        // rather than send a request that would 403 and fail the whole save.
        const [updatedContent, updatedDetails] = await Promise.all([
          canManage
            ? api.put<ContentItem>(`/content/${savedContent._id}`, {
                categories: selectedCategoryIds,
                tags: selectedTagIds,
                author: selectedAuthorId || null,
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
            author: updatedContent ? updatedContent.author : prev.author,
            details: [...byLang.values()],
          }
        })
        toast.success(t('contents.toastUpdated'))
      } else {
        const created = await api.post<ContentItem>('/content', {
          application: applicationId,
          categories: selectedCategoryIds,
          tags: selectedTagIds,
          author: selectedAuthorId || null,
          details: entries.map(([langKey, d]) => ({
            langKey,
            ...d,
            sections: toPersistableSections(d.sections),
          })),
        })
        toast.success(t('contents.toastCreated'))
        onCreated(created)
        return
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : (isEdit ? t('contents.saveFailed') : t('contents.createFailed'))
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, handleSave, isEdit }
}

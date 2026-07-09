import { useState } from 'react'
import { api } from '../api/client'
import { useToast } from '../components/ui/useToast'
import { toPersistableSections } from '../factories/pageElements'
import type { LangKey } from '../types/content'
import type { PageItem, PageDetail } from '../types/page'
import type { PageDraft } from './usePageDrafts'

export function usePageSave({
  applicationId,
  canManage,
  savedPage,
  setSavedPage,
  isHomepage,
  onCreated,
}: {
  applicationId: string
  canManage: boolean
  savedPage: PageItem | null
  setSavedPage: (updater: (prev: PageItem | null) => PageItem | null) => void
  isHomepage: boolean
  onCreated: (created: PageItem) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { showToast } = useToast()
  const isEdit = savedPage !== null

  async function handleSave(drafts: Partial<Record<LangKey, PageDraft>>) {
    setError('')
    const entries = (Object.entries(drafts) as [LangKey, PageDraft][]).filter(([, d]) => d.title.trim())
    if (entries.length === 0) {
      setError('At least one language needs a title')
      showToast('At least one language needs a title', 'error')
      return
    }
    setLoading(true)
    try {
      if (savedPage) {
        // isHomepage is admin-only server-side — a plain staff member can't call
        // this endpoint at all, so skip it entirely rather than send a request
        // that would 403 and fail the whole save.
        const [updatedPage, updatedDetails] = await Promise.all([
          canManage && isHomepage !== savedPage.isHomepage
            ? api.put<PageItem>(`/pages/${savedPage._id}`, { isHomepage })
            : null,
          Promise.all(
            entries.map(([langKey, d]) =>
              api.put<PageDetail>(`/pages/${savedPage._id}/details/${langKey}`, {
                ...d,
                sections: toPersistableSections(d.sections),
              }),
            ),
          ),
        ])
        setSavedPage((prev) => {
          if (!prev) return prev
          const byLang = new Map(prev.details.map((d) => [d.langKey, d]))
          for (const d of updatedDetails) byLang.set(d.langKey, d)
          return {
            ...prev,
            isHomepage: updatedPage ? updatedPage.isHomepage : prev.isHomepage,
            details: [...byLang.values()],
          }
        })
        showToast('Page has been updated')
      } else {
        const created = await api.post<PageItem>('/pages', {
          application: applicationId,
          isHomepage,
          details: entries.map(([langKey, d]) => ({
            langKey,
            ...d,
            sections: toPersistableSections(d.sections),
          })),
        })
        showToast('Page has been created')
        onCreated(created)
        return
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to ${isEdit ? 'save' : 'create'} page`
      setError(message)
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, handleSave, isEdit }
}

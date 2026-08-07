import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '../api/client'
import { toPersistableSections } from '../factories/pageElements'
import { useLocale } from '../i18n/useLocale'
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
  const { t } = useLocale()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const isEdit = savedPage !== null

  async function handleSave(drafts: Partial<Record<LangKey, PageDraft>>) {
    setError('')
    const entries = (Object.entries(drafts) as [LangKey, PageDraft][]).filter(([, d]) => d.title.trim())
    if (entries.length === 0) {
      setError(t('validation.atLeastOneLanguageTitle'))
      toast.error(t('validation.atLeastOneLanguageTitle'))
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
        toast.success(t('pagesList.toastUpdated'))
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
        toast.success(t('pagesList.toastCreated'))
        onCreated(created)
        return
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : (isEdit ? t('pagesList.saveFailed') : t('pagesList.createFailed'))
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, handleSave, isEdit }
}

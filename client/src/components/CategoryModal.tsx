import { toast } from 'sonner'
import { useState } from 'react'
import { api } from '../api/client'
import { Backdrop, ModalPanel, ModalHeader, ModalFooter, ErrorBanner, CancelButton, PrimaryButton } from './ui/Modal'
import { SelectField } from './ui/FormField'
import StatusToggle from './ui/StatusToggle'
import TranslatedTitleTabs from './ui/TranslatedTitleTabs'
import TranslatedTitleField from './ui/TranslatedTitleField'
import { useTranslatedTitleForm } from '../hooks/useTranslatedTitleForm'
import { Label } from '@/components/ui/label'
import { getPreviewTitle } from '../utils/translations'
import { useLocale } from '../i18n/useLocale'
import type { LangKey } from '../types/content'
import type { Category } from '../types/category'

// A category can't be its own ancestor — exclude itself and its descendants
// from the selectable parent options (the server double-checks this too).
function excludedIds(category: Category | null, categories: Category[]): Set<string> {
  const excluded = new Set<string>()
  if (!category) return excluded
  excluded.add(category._id)
  let added = true
  while (added) {
    added = false
    for (const c of categories) {
      if (c.parentId && excluded.has(c.parentId) && !excluded.has(c._id)) {
        excluded.add(c._id)
        added = true
      }
    }
  }
  return excluded
}

export default function CategoryModal({
  applicationId,
  allowedLanguages,
  categories,
  category,
  onClose,
  onSaved,
}: {
  applicationId: string
  allowedLanguages: LangKey[]
  categories: Category[]
  category: Category | null
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useLocale()
  const isEdit = category !== null
  const {
    titles, activeLang, setActiveLang, active, setActive, updateTitle, buildTranslations,
  } = useTranslatedTitleForm({
    allowedLanguages,
    initialTranslations: category?.translations ?? [],
    initialActive: category?.status !== 'inactive',
  })
  const [parentId, setParentId] = useState(category?.parentId ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const excluded = excludedIds(category, categories)
  const parentOptions = [
    { value: '', label: t('categories.noneTopLevel') },
    ...categories
      .filter((c) => !excluded.has(c._id))
      .map((c) => ({ value: c._id, label: getPreviewTitle(c.translations) })),
  ]

  async function handleSave() {
    setError('')
    const translations = buildTranslations()
    if (translations.length === 0) {
      setError(t('validation.atLeastOneLanguageTitle'))
      return
    }
    setLoading(true)
    try {
      const payload = { translations, parentId: parentId || null, status: active ? 'active' : 'inactive' }
      if (category) {
        await api.put(`/categories/${category._id}`, payload)
      } else {
        await api.post('/categories', { application: applicationId, ...payload })
      }
      toast.success(isEdit ? t('categories.toastUpdated') : t('categories.toastCreated'))
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : (isEdit ? t('categories.saveFailed') : t('categories.createFailed')))
      setLoading(false)
    }
  }

  return (
    <Backdrop onClose={onClose}>
      <ModalPanel>
        <ModalHeader
          title={isEdit ? t('categories.modalEditTitle') : t('categories.modalCreateTitle')}
          subtitle={isEdit ? t('categories.modalEditSubtitle') : t('categories.modalCreateSubtitle')}
        />

        <TranslatedTitleTabs allowedLanguages={allowedLanguages} activeLang={activeLang} titles={titles} onSelect={setActiveLang} />

        <div className="px-6 py-5 space-y-4">
          {error && <ErrorBanner message={error} />}
          <TranslatedTitleField
            allowedLanguages={allowedLanguages}
            activeLang={activeLang}
            value={titles[activeLang] ?? ''}
            onChange={(v) => updateTitle(activeLang, v)}
            placeholder={t('categories.titlePlaceholder')}
          />
          <SelectField
            label={t('categories.parentCategory')} value={parentId}
            onChange={setParentId}
            options={parentOptions}
          />
          <div>
            <Label className="block text-sm font-medium mb-1.5 text-muted-foreground">
              {t('common.status')}
            </Label>
            <div className="flex items-center gap-2">
              <StatusToggle
                checked={active}
                onToggle={() => setActive((v) => !v)}
                onLabel={t('common.activate')}
                offLabel={t('common.deactivate')}
              />
              <span className={`text-sm font-medium ${active ? 'text-(--color-success)' : 'text-muted-foreground'}`}>
                {active ? t('common.active') : t('common.inactive')}
              </span>
            </div>
          </div>
        </div>
        <ModalFooter>
          <CancelButton onClick={onClose} disabled={loading} />
          <PrimaryButton onClick={handleSave} disabled={loading}>
            {loading ? (isEdit ? t('common.saving') : t('common.creating')) : (isEdit ? t('common.saveChanges') : t('categories.createCategory'))}
          </PrimaryButton>
        </ModalFooter>
      </ModalPanel>
    </Backdrop>
  )
}

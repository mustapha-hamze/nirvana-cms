import { toast } from 'sonner'
import { useState } from 'react'
import { api } from '../api/client'
import { Backdrop, ModalPanel, ModalHeader, ModalFooter, ErrorBanner, CancelButton, PrimaryButton } from './ui/Modal'
import StatusToggle from './ui/StatusToggle'
import TranslatedTitleTabs from './ui/TranslatedTitleTabs'
import { TextField, TextAreaField } from './ui/FormField'
import ImageUploadField from './body/ImageUploadField'
import { useTranslatedFieldsForm } from '../hooks/useTranslatedFieldsForm'
import { Label } from '@/components/ui/label'
import { useLocale } from '../i18n/useLocale'
import type { LangKey } from '../types/content'
import type { MenuCategory } from '../types/menu'

export default function MenuCategoryModal({
  applicationId,
  menuId,
  allowedLanguages,
  category,
  onClose,
  onSaved,
}: {
  applicationId: string
  menuId: string
  allowedLanguages: LangKey[]
  category: MenuCategory | null
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useLocale()
  const isEdit = category !== null
  const {
    titles, descriptions, activeLang, setActiveLang, updateTitle, updateDescription, buildTranslations,
  } = useTranslatedFieldsForm({
    allowedLanguages,
    initialTranslations: category?.translations ?? [],
  })
  const [image, setImage] = useState(category?.image ?? '')
  const [sortOrder, setSortOrder] = useState(String(category?.sortOrder ?? 0))
  const [active, setActive] = useState(category?.status !== 'inactive')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setError('')
    const translations = buildTranslations()
    if (translations.length === 0) {
      setError(t('validation.atLeastOneLanguageTitle'))
      return
    }
    setLoading(true)
    try {
      const payload = {
        translations,
        image,
        sortOrder: Number(sortOrder) || 0,
        status: active ? 'active' : 'inactive',
      }
      if (category) {
        await api.put(`/menu-categories/${category._id}`, payload)
      } else {
        await api.post('/menu-categories', { application: applicationId, menu: menuId, ...payload })
      }
      toast.success(isEdit ? t('menuCategories.toastUpdated') : t('menuCategories.toastCreated'))
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : (isEdit ? t('menuCategories.saveFailed') : t('menuCategories.createFailed')))
      setLoading(false)
    }
  }

  return (
    <Backdrop onClose={onClose}>
      <ModalPanel>
        <ModalHeader
          title={isEdit ? t('menuCategories.modalEditTitle') : t('menuCategories.modalCreateTitle')}
          subtitle={isEdit ? t('menuCategories.modalEditSubtitle') : t('menuCategories.modalCreateSubtitle')}
        />

        <TranslatedTitleTabs allowedLanguages={allowedLanguages} activeLang={activeLang} titles={titles} onSelect={setActiveLang} />

        <div className="px-6 py-5 space-y-4">
          {error && <ErrorBanner message={error} />}
          <TextField
            label={allowedLanguages.length > 1 ? `${t('table.title')} (${activeLang})` : t('table.title')}
            required
            value={titles[activeLang] ?? ''}
            onChange={(v) => updateTitle(activeLang, v)}
            placeholder={t('menuCategories.titlePlaceholder')}
            dir={activeLang === 'fa' ? 'rtl' : 'ltr'}
          />
          <TextAreaField
            label={t('common.description')}
            value={descriptions[activeLang] ?? ''}
            onChange={(v) => updateDescription(activeLang, v)}
            placeholder={t('menuCategories.descriptionPlaceholder')}
            dir={activeLang === 'fa' ? 'rtl' : 'ltr'}
          />
          <ImageUploadField applicationId={applicationId} url={image} onUploaded={setImage} domain="menuCategory" />
          <TextField label={t('menuCategories.sortOrder')} type="number" value={sortOrder} onChange={setSortOrder} dir="ltr" />
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
            {loading ? (isEdit ? t('common.saving') : t('common.creating')) : (isEdit ? t('common.saveChanges') : t('menuCategories.createCategory'))}
          </PrimaryButton>
        </ModalFooter>
      </ModalPanel>
    </Backdrop>
  )
}

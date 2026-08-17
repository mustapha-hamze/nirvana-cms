import { toast } from 'sonner'
import { useState } from 'react'
import { api } from '../api/client'
import { Backdrop, ModalPanel, ModalHeader, ModalFooter, ErrorBanner, CancelButton, PrimaryButton } from './ui/Modal'
import StatusToggle from './ui/StatusToggle'
import TranslatedTitleTabs from './ui/TranslatedTitleTabs'
import { TextField, TextAreaField, SelectField } from './ui/FormField'
import ImageUploadField from './body/ImageUploadField'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useTranslatedFieldsForm } from '../hooks/useTranslatedFieldsForm'
import { useLocale } from '../i18n/useLocale'
import type { LangKey } from '../types/content'
import type { MenuItem, MenuItemAvailability } from '../types/menu'

function parseCsv(value: string): string[] {
  return value.split(',').map((v) => v.trim()).filter(Boolean)
}

export default function MenuItemModal({
  applicationId,
  menuId,
  categoryId,
  allowedLanguages,
  item,
  canManageStatus,
  onClose,
  onSaved,
}: {
  applicationId: string
  menuId: string
  categoryId: string
  allowedLanguages: LangKey[]
  item: MenuItem | null
  canManageStatus: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useLocale()
  const isEdit = item !== null
  const {
    titles, descriptions, activeLang, setActiveLang, updateTitle, updateDescription, buildTranslations,
  } = useTranslatedFieldsForm({
    allowedLanguages,
    initialTranslations: item?.translations ?? [],
  })
  const [image, setImage] = useState(item?.image ?? '')
  const [price, setPrice] = useState(item ? String(item.price) : '')
  const [calories, setCalories] = useState(item?.calories !== undefined ? String(item.calories) : '')
  const [availability, setAvailability] = useState<MenuItemAvailability>(item?.availability ?? 'available')
  const [sortOrder, setSortOrder] = useState(String(item?.sortOrder ?? 0))
  const [ingredients, setIngredients] = useState((item?.ingredients ?? []).join(', '))
  const [allergens, setAllergens] = useState((item?.allergens ?? []).join(', '))
  const [isVegetarian, setIsVegetarian] = useState(item?.isVegetarian ?? false)
  const [isVegan, setIsVegan] = useState(item?.isVegan ?? false)
  const [isSpicy, setIsSpicy] = useState(item?.isSpicy ?? false)
  const [spicyLevel, setSpicyLevel] = useState(String(item?.spicyLevel ?? 1))
  const [active, setActive] = useState(item?.status !== 'inactive')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setError('')
    const translations = buildTranslations()
    if (translations.length === 0) {
      setError(t('validation.atLeastOneLanguageTitle'))
      return
    }
    if (translations.some((tr) => !tr.description)) {
      setError(t('menuItems.descriptionPlaceholder') + ' ' + t('common.required').toLowerCase())
      return
    }
    if (!price.trim() || Number(price) < 0 || Number.isNaN(Number(price))) {
      setError(t('menuItems.price') + ' ' + t('common.required').toLowerCase())
      return
    }

    setLoading(true)
    try {
      const payload = {
        translations,
        image,
        price: Number(price),
        calories: calories.trim() ? Number(calories) : undefined,
        availability,
        sortOrder: Number(sortOrder) || 0,
        ingredients: parseCsv(ingredients),
        allergens: parseCsv(allergens),
        isVegetarian,
        isVegan,
        isSpicy,
        spicyLevel: isSpicy ? Number(spicyLevel) || 0 : 0,
      }
      if (item) {
        await api.put(`/menu-items/${item._id}`, payload)
        if (canManageStatus && active !== (item.status !== 'inactive')) {
          await api.patch(`/menu-items/${item._id}/status`, { status: active ? 'active' : 'inactive' })
        }
      } else {
        await api.post('/menu-items', { application: applicationId, menu: menuId, category: categoryId, ...payload })
      }
      toast.success(isEdit ? t('menuItems.toastUpdated') : t('menuItems.toastCreated'))
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : (isEdit ? t('menuItems.saveFailed') : t('menuItems.createFailed')))
      setLoading(false)
    }
  }

  const dir = activeLang === 'fa' ? 'rtl' : 'ltr'

  return (
    <Backdrop onClose={onClose}>
      <ModalPanel maxWidth="max-w-lg">
        <ModalHeader
          title={isEdit ? t('menuItems.modalEditTitle') : t('menuItems.modalCreateTitle')}
          subtitle={isEdit ? t('menuItems.modalEditSubtitle') : t('menuItems.modalCreateSubtitle')}
        />

        <TranslatedTitleTabs allowedLanguages={allowedLanguages} activeLang={activeLang} titles={titles} onSelect={setActiveLang} />

        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {error && <ErrorBanner message={error} />}
          <TextField
            label={allowedLanguages.length > 1 ? `${t('table.title')} (${activeLang})` : t('table.title')}
            required
            value={titles[activeLang] ?? ''}
            onChange={(v) => updateTitle(activeLang, v)}
            placeholder={t('menuItems.titlePlaceholder')}
            dir={dir}
          />
          <TextAreaField
            label={t('common.description')}
            required
            value={descriptions[activeLang] ?? ''}
            onChange={(v) => updateDescription(activeLang, v)}
            placeholder={t('menuItems.descriptionPlaceholder')}
            dir={dir}
          />
          <ImageUploadField applicationId={applicationId} url={image} onUploaded={setImage} domain="menuItem" />

          <div className="grid grid-cols-2 gap-3">
            <TextField label={t('menuItems.price')} required type="number" value={price} onChange={setPrice} dir="ltr" />
            <TextField label={t('menuItems.calories')} type="number" value={calories} onChange={setCalories} dir="ltr" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SelectField<MenuItemAvailability>
              label={t('menuItems.availability')}
              value={availability}
              onChange={setAvailability}
              options={[
                { value: 'available', label: t('menuItems.availabilityAvailable') },
                { value: 'unavailable', label: t('menuItems.availabilityUnavailable') },
                { value: 'sold_out', label: t('menuItems.availabilitySoldOut') },
              ]}
            />
            <TextField label={t('menuItems.sortOrder')} type="number" value={sortOrder} onChange={setSortOrder} dir="ltr" />
          </div>

          <TextField label={t('menuItems.ingredients')} value={ingredients} onChange={setIngredients} placeholder={t('menuItems.ingredientsPlaceholder')} dir="ltr" />
          <TextField label={t('menuItems.allergens')} value={allergens} onChange={setAllergens} placeholder={t('menuItems.allergensPlaceholder')} dir="ltr" />

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox checked={isVegetarian} onCheckedChange={(v) => setIsVegetarian(v === true)} />
              {t('menuItems.isVegetarian')}
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox checked={isVegan} onCheckedChange={(v) => setIsVegan(v === true)} />
              {t('menuItems.isVegan')}
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox checked={isSpicy} onCheckedChange={(v) => setIsSpicy(v === true)} />
              {t('menuItems.isSpicy')}
            </label>
          </div>
          {isSpicy && (
            <SelectField<string>
              label={t('menuItems.spicyLevel')}
              value={spicyLevel}
              onChange={setSpicyLevel}
              options={[1, 2, 3].map((n) => ({ value: String(n), label: String(n) }))}
            />
          )}

          {canManageStatus && (
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
          )}
        </div>
        <ModalFooter>
          <CancelButton onClick={onClose} disabled={loading} />
          <PrimaryButton onClick={handleSave} disabled={loading}>
            {loading ? (isEdit ? t('common.saving') : t('common.creating')) : (isEdit ? t('common.saveChanges') : t('menuItems.createItem'))}
          </PrimaryButton>
        </ModalFooter>
      </ModalPanel>
    </Backdrop>
  )
}

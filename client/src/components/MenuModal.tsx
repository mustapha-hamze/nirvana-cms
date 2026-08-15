import { toast } from 'sonner'
import { useState } from 'react'
import { api } from '../api/client'
import { Backdrop, ModalPanel, ModalHeader, ModalFooter, ErrorBanner, CancelButton, PrimaryButton } from './ui/Modal'
import { TextField } from './ui/FormField'
import StatusToggle from './ui/StatusToggle'
import { Label } from '@/components/ui/label'
import { useLocale } from '../i18n/useLocale'
import type { Menu, MenuSettings } from '../types/menu'

const DEFAULT_SETTINGS: MenuSettings = { showCalories: true, showImages: true, showUnavailableItems: true }

export default function MenuModal({
  applicationId,
  menu,
  onClose,
  onSaved,
}: {
  applicationId: string
  menu: Menu | null
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useLocale()
  const isEdit = menu !== null
  const [slug, setSlug] = useState(menu?.slug ?? '')
  const [currency, setCurrency] = useState(menu?.currency ?? '')
  const [settings, setSettings] = useState<MenuSettings>(menu?.settings ?? DEFAULT_SETTINGS)
  const [active, setActive] = useState(menu?.status !== 'inactive')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toggleSetting(key: keyof MenuSettings) {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSave() {
    setError('')
    if (!slug.trim()) {
      setError(t('menus.slug') + ' ' + t('common.required').toLowerCase())
      return
    }
    if (!currency.trim()) {
      setError(t('menus.currency') + ' ' + t('common.required').toLowerCase())
      return
    }
    setLoading(true)
    try {
      const payload = { slug: slug.trim(), currency: currency.trim(), settings, status: active ? 'active' : 'inactive' }
      if (menu) {
        await api.put(`/menus/${menu._id}`, payload)
      } else {
        await api.post('/menus', { application: applicationId, ...payload })
      }
      toast.success(isEdit ? t('menus.toastUpdated') : t('menus.toastCreated'))
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : (isEdit ? t('menus.saveFailed') : t('menus.createFailed')))
      setLoading(false)
    }
  }

  return (
    <Backdrop onClose={onClose}>
      <ModalPanel>
        <ModalHeader
          title={isEdit ? t('menus.modalEditTitle') : t('menus.modalCreateTitle')}
          subtitle={isEdit ? t('menus.modalEditSubtitle') : t('menus.modalCreateSubtitle')}
        />

        <div className="px-6 py-5 space-y-4">
          {error && <ErrorBanner message={error} />}
          <div>
            <TextField label={t('menus.slug')} required value={slug} onChange={setSlug} placeholder={t('menus.slugPlaceholder')} dir="ltr" />
            <p className="text-xs mt-1 text-(--color-text-tertiary)">{t('menus.slugHint')}</p>
          </div>
          <TextField label={t('menus.currency')} required value={currency} onChange={setCurrency} placeholder={t('menus.currencyPlaceholder')} dir="ltr" />

          <div>
            <Label className="block text-sm font-medium mb-2 text-muted-foreground">
              {t('menus.settingsTitle')}
            </Label>
            <div className="space-y-2.5 rounded-lg border p-3">
              {(['showCalories', 'showImages', 'showUnavailableItems'] as const).map((key) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-foreground">{t(`menus.${key}`)}</span>
                  <StatusToggle checked={settings[key]} onToggle={() => toggleSetting(key)} />
                </div>
              ))}
            </div>
          </div>

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
            {loading ? (isEdit ? t('common.saving') : t('common.creating')) : (isEdit ? t('common.saveChanges') : t('menus.createMenu'))}
          </PrimaryButton>
        </ModalFooter>
      </ModalPanel>
    </Backdrop>
  )
}

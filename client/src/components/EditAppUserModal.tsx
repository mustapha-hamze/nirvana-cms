import { useState, type FormEvent } from 'react'
import { api } from '../api/client'
import { Backdrop, ModalPanel, ModalHeader, ModalFooter, ErrorBanner, CancelButton, PrimaryButton } from './ui/Modal'
import { TextField, SelectField, PasswordField } from './ui/FormField'
import { useLocale } from '../i18n/useLocale'
import type { TranslationKey } from '../i18n/types'

type AppRole = 'WebSiteAdmin' | 'WebSiteContentCreator' | 'WebsiteUser'

type AppUser = {
  _id: string
  name: string
  role: AppRole
}

const ROLE_OPTION_KEYS: { value: AppRole; labelKey: TranslationKey }[] = [
  { value: 'WebSiteAdmin', labelKey: 'appUsers.roleWebSiteAdmin' },
  { value: 'WebSiteContentCreator', labelKey: 'appUsers.roleContentCreator' },
  { value: 'WebsiteUser', labelKey: 'appUsers.roleWebsiteUser' },
]

export default function EditAppUserModal({
  user,
  onClose,
  onSaved,
}: {
  user: AppUser
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useLocale()
  const ROLE_OPTIONS = ROLE_OPTION_KEYS.map((o) => ({ value: o.value, label: t(o.labelKey) }))
  const [name, setName] = useState(user.name)
  const [role, setRole] = useState<AppRole>(user.role)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload: { name: string; role: AppRole; password?: string } = { name, role }
      if (password) payload.password = password
      await api.put(`/users/${user._id}`, payload)
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('appUsers.updateFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Backdrop onClose={onClose}>
      <ModalPanel>
        <ModalHeader title={t('appUsers.modalEditTitle')} subtitle={t('appUsers.modalEditSubtitle')} />
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {error && <ErrorBanner message={error} />}
            <TextField label={t('common.fullName')} required value={name} onChange={setName} />
            <SelectField label={t('table.role')} required value={role} onChange={setRole} options={ROLE_OPTIONS} />
            <PasswordField
              label={t('common.newPassword')} value={password} onChange={setPassword}
              placeholder={t('common.leaveBlankPassword')}
            />
          </div>
          <ModalFooter>
            <CancelButton onClick={onClose} disabled={loading} />
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? t('common.saving') : t('common.saveChanges')}
            </PrimaryButton>
          </ModalFooter>
        </form>
      </ModalPanel>
    </Backdrop>
  )
}

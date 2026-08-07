import { useState, type FormEvent } from 'react'
import { api } from '../api/client'
import { Backdrop, ModalPanel, ModalHeader, ModalFooter, ErrorBanner, CancelButton, PrimaryButton } from './ui/Modal'
import { TextField, PasswordField } from './ui/FormField'
import { useLocale } from '../i18n/useLocale'

type SuperAdminUser = {
  _id: string
  name: string
}

export default function EditSuperAdminModal({
  admin,
  onClose,
  onSaved,
}: {
  admin: SuperAdminUser
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useLocale()
  const [name, setName] = useState(admin.name)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload: { name: string; password?: string } = { name }
      if (password) payload.password = password
      await api.put(`/users/${admin._id}`, payload)
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('superAdmins.updateFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Backdrop onClose={onClose}>
      <ModalPanel>
        <ModalHeader title={t('superAdmins.modalEditTitle')} subtitle={t('superAdmins.modalEditSubtitle')} />
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {error && <ErrorBanner message={error} />}
            <TextField label={t('common.fullName')} required value={name} onChange={setName} />
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

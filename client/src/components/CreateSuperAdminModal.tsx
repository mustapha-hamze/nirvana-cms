import { useState, type FormEvent } from 'react'
import { api } from '../api/client'
import { Backdrop, ModalPanel, ModalHeader, ModalFooter, ErrorBanner, CancelButton, PrimaryButton } from './ui/Modal'
import { TextField, PasswordField } from './ui/FormField'
import { useLocale } from '../i18n/useLocale'

type Props = {
  onClose: () => void
  onCreated: () => void
}

export default function CreateSuperAdminModal({ onClose, onCreated }: Props) {
  const { t } = useLocale()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/users', { name, email, password, role: 'SuperAdmin' })
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('superAdmins.createFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Backdrop onClose={onClose}>
      <ModalPanel>
        <ModalHeader title={t('superAdmins.modalCreateTitle')} subtitle={t('superAdmins.modalCreateSubtitle')} />
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {error && <ErrorBanner message={error} />}
            <TextField
              label={t('common.fullName')} required value={name} onChange={setName}
              placeholder={t('common.fullNamePlaceholder')}
            />
            <TextField
              label={t('table.email')} required type="email" autoComplete="email"
              value={email} onChange={setEmail} placeholder={t('common.emailPlaceholder')} dir="ltr"
            />
            <PasswordField
              label={t('auth.password')} required value={password} onChange={setPassword}
              placeholder="••••••••"
            />
          </div>
          <ModalFooter>
            <CancelButton onClick={onClose} disabled={loading} />
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? t('common.creating') : t('superAdmins.modalCreateTitle')}
            </PrimaryButton>
          </ModalFooter>
        </form>
      </ModalPanel>
    </Backdrop>
  )
}

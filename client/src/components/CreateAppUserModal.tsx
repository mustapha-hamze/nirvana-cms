import { useState, type FormEvent } from 'react'
import { api } from '../api/client'
import { Backdrop, ModalPanel, ModalHeader, ModalFooter, ErrorBanner, CancelButton, PrimaryButton } from './ui/Modal'
import { TextField, SelectField, PasswordField } from './ui/FormField'
import { useLocale } from '../i18n/useLocale'
import type { TranslationKey } from '../i18n/types'

type AppRole = 'WebSiteAdmin' | 'WebSiteContentCreator' | 'WebsiteUser'

type Props = {
  applicationId: string
  onClose: () => void
  onCreated: () => void
}

const ROLE_OPTION_KEYS: { value: AppRole; labelKey: TranslationKey }[] = [
  { value: 'WebSiteAdmin', labelKey: 'appUsers.roleWebSiteAdmin' },
  { value: 'WebSiteContentCreator', labelKey: 'appUsers.roleContentCreator' },
  { value: 'WebsiteUser', labelKey: 'appUsers.roleWebsiteUser' },
]

export default function CreateAppUserModal({ applicationId, onClose, onCreated }: Props) {
  const { t } = useLocale()
  const ROLE_OPTIONS = ROLE_OPTION_KEYS.map((o) => ({ value: o.value, label: t(o.labelKey) }))
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<AppRole>('WebSiteContentCreator')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/users', { name, email, password, role, applications: [applicationId] })
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('appUsers.createFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Backdrop onClose={onClose}>
      <ModalPanel>
        <ModalHeader title={t('appUsers.modalCreateTitle')} subtitle={t('appUsers.modalCreateSubtitle')} />
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
            <SelectField label={t('table.role')} required value={role} onChange={setRole} options={ROLE_OPTIONS} />
            <PasswordField
              label={t('auth.password')} required value={password} onChange={setPassword}
              placeholder="••••••••"
            />
          </div>
          <ModalFooter>
            <CancelButton onClick={onClose} disabled={loading} />
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? t('common.creating') : t('appUsers.createUser')}
            </PrimaryButton>
          </ModalFooter>
        </form>
      </ModalPanel>
    </Backdrop>
  )
}

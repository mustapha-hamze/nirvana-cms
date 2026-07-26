import { useState, type FormEvent } from 'react'
import { api } from '../api/client'
import { Backdrop, ModalPanel, ModalHeader, ModalFooter, ErrorBanner, CancelButton, PrimaryButton } from './ui/Modal'
import { TextField, SelectField, PasswordField } from './ui/FormField'

type AppRole = 'WebSiteAdmin' | 'WebSiteContentCreator' | 'WebsiteUser'

type Props = {
  applicationId: string
  onClose: () => void
  onCreated: () => void
}

const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: 'WebSiteAdmin', label: 'Website Admin' },
  { value: 'WebSiteContentCreator', label: 'Content Creator' },
  { value: 'WebsiteUser', label: 'Website User' },
]

export default function CreateAppUserModal({ applicationId, onClose, onCreated }: Props) {
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
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Backdrop onClose={onClose}>
      <ModalPanel>
        <ModalHeader title="Create User" subtitle="Add a new user to this application" />
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {error && <ErrorBanner message={error} />}
            <TextField
              label="Full name" required value={name} onChange={setName}
              placeholder="e.g. Jordan Lee"
            />
            <TextField
              label="Email" required type="email" autoComplete="email"
              value={email} onChange={setEmail} placeholder="e.g. jordan@company.com"
            />
            <SelectField label="Role" required value={role} onChange={setRole} options={ROLE_OPTIONS} />
            <PasswordField
              label="Password" required value={password} onChange={setPassword}
              placeholder="••••••••"
            />
          </div>
          <ModalFooter>
            <CancelButton onClick={onClose} disabled={loading} />
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? 'Creating…' : 'Create User'}
            </PrimaryButton>
          </ModalFooter>
        </form>
      </ModalPanel>
    </Backdrop>
  )
}

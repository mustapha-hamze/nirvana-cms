import { useState, type FormEvent } from 'react'
import { api } from '../api/client'
import { Backdrop, ModalPanel, ModalHeader, ModalFooter, ErrorBanner, CancelButton, PrimaryButton } from './ui/Modal'
import { TextField, PasswordField } from './ui/FormField'

type Props = {
  onClose: () => void
  onCreated: () => void
}

export default function CreateSuperAdminModal({ onClose, onCreated }: Props) {
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
      setError(err instanceof Error ? err.message : 'Failed to create super admin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Backdrop onClose={onClose}>
      <ModalPanel>
        <ModalHeader title="Create Super Admin" subtitle="Grant another account full platform access" />
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
            <PasswordField
              label="Password" required value={password} onChange={setPassword}
              placeholder="••••••••"
            />
          </div>
          <ModalFooter>
            <CancelButton onClick={onClose} disabled={loading} />
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? 'Creating…' : 'Create Super Admin'}
            </PrimaryButton>
          </ModalFooter>
        </form>
      </ModalPanel>
    </Backdrop>
  )
}

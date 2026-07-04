import { useState, type FormEvent } from 'react'
import { api } from '../api/client'
import { Backdrop, ModalPanel, ModalHeader, ModalFooter, ErrorBanner, CancelButton, PrimaryButton } from './ui/Modal'
import { TextField, SelectField, PasswordField } from './ui/FormField'

type AppRole = 'WebSiteAdmin' | 'WebSiteContentCreator' | 'WebsiteUser'

type AppUser = {
  _id: string
  name: string
  role: AppRole
}

const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: 'WebSiteAdmin', label: 'Website Admin' },
  { value: 'WebSiteContentCreator', label: 'Content Creator' },
  { value: 'WebsiteUser', label: 'Website User' },
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
      setError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Backdrop onClose={onClose}>
      <ModalPanel>
        <ModalHeader title="Edit User" subtitle="Update name, role, or set a new password" onClose={onClose} />
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {error && <ErrorBanner message={error} />}
            <TextField label="Full name" required value={name} onChange={setName} />
            <SelectField label="Role" required value={role} onChange={setRole} options={ROLE_OPTIONS} />
            <PasswordField
              label="New password" value={password} onChange={setPassword}
              placeholder="Leave blank to keep current password"
            />
          </div>
          <ModalFooter>
            <CancelButton onClick={onClose} disabled={loading} />
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Save Changes'}
            </PrimaryButton>
          </ModalFooter>
        </form>
      </ModalPanel>
    </Backdrop>
  )
}

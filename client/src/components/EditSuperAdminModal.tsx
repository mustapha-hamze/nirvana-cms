import { useState, type FormEvent } from 'react'
import { api } from '../api/client'
import { Backdrop, ModalPanel, ModalHeader, ModalFooter, ErrorBanner, CancelButton, PrimaryButton } from './ui/Modal'
import { TextField, PasswordField } from './ui/FormField'

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
      setError(err instanceof Error ? err.message : 'Failed to update super admin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Backdrop onClose={onClose}>
      <ModalPanel>
        <ModalHeader title="Edit Super Admin" subtitle="Update name, or set a new password" />
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {error && <ErrorBanner message={error} />}
            <TextField label="Full name" required value={name} onChange={setName} />
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

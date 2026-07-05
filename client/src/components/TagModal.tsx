import { useState } from 'react'
import { api } from '../api/client'
import { Backdrop, ModalPanel, ModalHeader, ModalFooter, ErrorBanner, CancelButton, PrimaryButton } from './ui/Modal'
import { TextField } from './ui/FormField'
import StatusToggle from './ui/StatusToggle'
import { useToast } from './ui/useToast'
import { theme } from '../theme'
import type { Tag } from '../types/tag'

export default function TagModal({
  applicationId,
  tag,
  onClose,
  onSaved,
}: {
  applicationId: string
  tag: Tag | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = tag !== null
  const [title, setTitle] = useState(tag?.title ?? '')
  const [active, setActive] = useState(tag?.status !== 'inactive')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { showToast } = useToast()

  async function handleSave() {
    setError('')
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    setLoading(true)
    try {
      const payload = { title, status: active ? 'active' : 'inactive' }
      if (tag) {
        await api.put(`/tags/${tag._id}`, payload)
      } else {
        await api.post('/tags', { application: applicationId, ...payload })
      }
      showToast(isEdit ? 'Tag updated' : 'Tag created')
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isEdit ? 'save' : 'create'} tag`)
      setLoading(false)
    }
  }

  return (
    <Backdrop onClose={onClose}>
      <ModalPanel>
        <ModalHeader
          title={isEdit ? 'Edit Tag' : 'Create Tag'}
          subtitle={isEdit ? 'Update this tag' : 'Add a new tag to label content'}
          onClose={onClose}
        />
        <div className="px-6 py-5 space-y-4">
          {error && <ErrorBanner message={error} />}
          <TextField
            label="Title" required value={title}
            onChange={setTitle}
            placeholder="e.g. Breaking"
          />
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: theme.textSecondary }}>
              Status
            </label>
            <div className="flex items-center gap-2">
              <StatusToggle
                checked={active}
                onToggle={() => setActive((v) => !v)}
                onLabel="Activate"
                offLabel="Deactivate"
              />
              <span
                className="text-sm font-medium"
                style={{ color: active ? theme.success : theme.textSecondary }}
              >
                {active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
        <ModalFooter>
          <CancelButton onClick={onClose} disabled={loading} />
          <PrimaryButton onClick={handleSave} disabled={loading}>
            {loading ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save Changes' : 'Create Tag')}
          </PrimaryButton>
        </ModalFooter>
      </ModalPanel>
    </Backdrop>
  )
}

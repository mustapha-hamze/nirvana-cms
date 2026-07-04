import { useState } from 'react'
import { api } from '../api/client'
import { Backdrop, ModalPanel, ModalHeader, ModalFooter, ErrorBanner, CancelButton, PrimaryButton } from './ui/Modal'
import { TextField, SelectField } from './ui/FormField'
import StatusToggle from './ui/StatusToggle'
import { theme } from '../theme'
import type { Category } from '../types/category'

// A category can't be its own ancestor — exclude itself and its descendants
// from the selectable parent options (the server double-checks this too).
function excludedIds(category: Category | null, categories: Category[]): Set<string> {
  const excluded = new Set<string>()
  if (!category) return excluded
  excluded.add(category._id)
  let added = true
  while (added) {
    added = false
    for (const c of categories) {
      if (c.parentId && excluded.has(c.parentId) && !excluded.has(c._id)) {
        excluded.add(c._id)
        added = true
      }
    }
  }
  return excluded
}

export default function CategoryModal({
  applicationId,
  categories,
  category,
  onClose,
  onSaved,
}: {
  applicationId: string
  categories: Category[]
  category: Category | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = category !== null
  const [title, setTitle] = useState(category?.title ?? '')
  const [parentId, setParentId] = useState(category?.parentId ?? '')
  const [active, setActive] = useState(category?.status !== 'inactive')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const excluded = excludedIds(category, categories)
  const parentOptions = [
    { value: '', label: 'None (top-level)' },
    ...categories.filter((c) => !excluded.has(c._id)).map((c) => ({ value: c._id, label: c.title })),
  ]

  async function handleSave() {
    setError('')
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    setLoading(true)
    try {
      const payload = { title, parentId: parentId || null, status: active ? 'active' : 'inactive' }
      if (category) {
        await api.put(`/categories/${category._id}`, payload)
      } else {
        await api.post('/categories', { application: applicationId, ...payload })
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isEdit ? 'save' : 'create'} category`)
      setLoading(false)
    }
  }

  return (
    <Backdrop onClose={onClose}>
      <ModalPanel>
        <ModalHeader
          title={isEdit ? 'Edit Category' : 'Create Category'}
          subtitle={isEdit ? 'Update this category' : 'Add a new category to organize content'}
          onClose={onClose}
        />
        <div className="px-6 py-5 space-y-4">
          {error && <ErrorBanner message={error} />}
          <TextField
            label="Title" required value={title}
            onChange={setTitle}
            placeholder="e.g. News"
          />
          <SelectField
            label="Parent Category" value={parentId}
            onChange={setParentId}
            options={parentOptions}
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
            {loading ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save Changes' : 'Create Category')}
          </PrimaryButton>
        </ModalFooter>
      </ModalPanel>
    </Backdrop>
  )
}

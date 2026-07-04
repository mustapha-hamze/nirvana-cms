import { useState, type FormEvent } from 'react'
import { api } from '../api/client'
import { Backdrop, ModalPanel, ModalHeader, ModalFooter, ErrorBanner, CancelButton, PrimaryButton } from './ui/Modal'
import { TextField, TextAreaField, SelectField } from './ui/FormField'
import { LANGUAGE_VALUES, LANGUAGE_LABELS, type LangKey, type ContentStatus } from '../types/content'

type Props = {
  applicationId: string
  onClose: () => void
  onCreated: () => void
}

const LANG_OPTIONS = LANGUAGE_VALUES.map((v) => ({ value: v, label: LANGUAGE_LABELS[v] }))
const STATUS_OPTIONS: { value: ContentStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
]

export default function CreateContentModal({ applicationId, onClose, onCreated }: Props) {
  const [langKey, setLangKey] = useState<LangKey>('en')
  const [title, setTitle] = useState('')
  const [headline, setHeadline] = useState('')
  const [abstract, setAbstract] = useState('')
  const [status, setStatus] = useState<ContentStatus>('draft')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/content', {
        application: applicationId,
        details: [{ langKey, title, headline, abstract, status }],
      })
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create content')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Backdrop onClose={onClose}>
      <ModalPanel>
        <ModalHeader
          title="Create Content"
          subtitle="Start with one language — add more translations after creating"
          onClose={onClose}
        />
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {error && <ErrorBanner message={error} />}
            <SelectField label="Language" required value={langKey} onChange={setLangKey} options={LANG_OPTIONS} />
            <TextField
              label="Title" required value={title} onChange={setTitle}
              placeholder="e.g. Welcome to our platform"
              dir={langKey === 'fa' ? 'rtl' : 'ltr'}
            />
            <TextField
              label="Headline" value={headline} onChange={setHeadline}
              placeholder="Short supporting line"
              dir={langKey === 'fa' ? 'rtl' : 'ltr'}
            />
            <TextAreaField
              label="Abstract" value={abstract} onChange={setAbstract}
              placeholder="Brief summary…"
              dir={langKey === 'fa' ? 'rtl' : 'ltr'}
            />
            <SelectField label="Status" required value={status} onChange={setStatus} options={STATUS_OPTIONS} />
          </div>
          <ModalFooter>
            <CancelButton onClick={onClose} disabled={loading} />
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? 'Creating…' : 'Create Content'}
            </PrimaryButton>
          </ModalFooter>
        </form>
      </ModalPanel>
    </Backdrop>
  )
}

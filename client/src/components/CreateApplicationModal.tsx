import { toast } from 'sonner'
import { useState, type FormEvent } from 'react'
import { api } from '../api/client'
import { Backdrop, ModalPanel, ModalHeader, ModalFooter, ErrorBanner, CancelButton, PrimaryButton } from './ui/Modal'
import { TextField, TextAreaField } from './ui/FormField'
import { useLocale } from '../i18n/useLocale'

type Props = {
  onClose: () => void
  onCreated: () => void
}

export default function CreateApplicationModal({ onClose, onCreated }: Props) {
  const { t } = useLocale()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/applications', { name, description })
      toast.success(t('applications.toastCreated'))
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('applications.createFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Backdrop onClose={onClose}>
      <ModalPanel>
        <ModalHeader title={t('applications.modalCreateTitle')} subtitle={t('applications.modalCreateSubtitle')} />
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {error && <ErrorBanner message={error} />}
            <TextField
              label={t('applications.nameLabel')} required value={name} onChange={setName}
              placeholder={t('applications.namePlaceholder')}
            />
            <TextAreaField
              label={t('common.description')} value={description} onChange={setDescription}
              placeholder={t('applications.descriptionPlaceholder')}
            />
          </div>
          <ModalFooter>
            <CancelButton onClick={onClose} disabled={loading} />
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? t('common.creating') : t('applications.createApplication')}
            </PrimaryButton>
          </ModalFooter>
        </form>
      </ModalPanel>
    </Backdrop>
  )
}

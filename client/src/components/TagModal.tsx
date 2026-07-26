import { toast } from 'sonner'
import { useState } from 'react'
import { api } from '../api/client'
import { Backdrop, ModalPanel, ModalHeader, ModalFooter, ErrorBanner, CancelButton, PrimaryButton } from './ui/Modal'
import StatusToggle from './ui/StatusToggle'
import TranslatedTitleTabs from './ui/TranslatedTitleTabs'
import TranslatedTitleField from './ui/TranslatedTitleField'
import { useTranslatedTitleForm } from '../hooks/useTranslatedTitleForm'
import { Label } from '@/components/ui/label'
import type { LangKey } from '../types/content'
import type { Tag } from '../types/tag'

export default function TagModal({
  applicationId,
  allowedLanguages,
  tag,
  onClose,
  onSaved,
}: {
  applicationId: string
  allowedLanguages: LangKey[]
  tag: Tag | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = tag !== null
  const {
    titles, activeLang, setActiveLang, active, setActive, updateTitle, buildTranslations,
  } = useTranslatedTitleForm({
    allowedLanguages,
    initialTranslations: tag?.translations ?? [],
    initialActive: tag?.status !== 'inactive',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setError('')
    const translations = buildTranslations()
    if (translations.length === 0) {
      setError('At least one language needs a title')
      return
    }
    setLoading(true)
    try {
      const payload = { translations, status: active ? 'active' : 'inactive' }
      if (tag) {
        await api.put(`/tags/${tag._id}`, payload)
      } else {
        await api.post('/tags', { application: applicationId, ...payload })
      }
      toast.success(isEdit ? 'Tag has been updated' : 'Tag has been created')
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
        />

        <TranslatedTitleTabs allowedLanguages={allowedLanguages} activeLang={activeLang} titles={titles} onSelect={setActiveLang} />

        <div className="px-6 py-5 space-y-4">
          {error && <ErrorBanner message={error} />}
          <TranslatedTitleField
            allowedLanguages={allowedLanguages}
            activeLang={activeLang}
            value={titles[activeLang] ?? ''}
            onChange={(v) => updateTitle(activeLang, v)}
            placeholder="e.g. Breaking"
          />
          <div>
            <Label className="block text-sm font-medium mb-1.5 text-muted-foreground">
              Status
            </Label>
            <div className="flex items-center gap-2">
              <StatusToggle
                checked={active}
                onToggle={() => setActive((v) => !v)}
                onLabel="Activate"
                offLabel="Deactivate"
              />
              <span className={`text-sm font-medium ${active ? 'text-(--color-success)' : 'text-muted-foreground'}`}>
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

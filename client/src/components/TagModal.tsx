import { useState } from 'react'
import { api } from '../api/client'
import { Backdrop, ModalPanel, ModalHeader, ModalFooter, ErrorBanner, CancelButton, PrimaryButton } from './ui/Modal'
import { TextField } from './ui/FormField'
import StatusToggle from './ui/StatusToggle'
import { useToast } from './ui/useToast'
import { theme } from '../theme'
import { LANGUAGE_LABELS, type LangKey } from '../types/content'
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
  const [titles, setTitles] = useState<Partial<Record<LangKey, string>>>(() => {
    const initial: Partial<Record<LangKey, string>> = {}
    for (const t of tag?.translations ?? []) initial[t.langKey] = t.title
    return initial
  })
  const [activeLang, setActiveLang] = useState<LangKey>(
    tag?.translations[0]?.langKey ?? allowedLanguages[0],
  )
  const [active, setActive] = useState(tag?.status !== 'inactive')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { showToast } = useToast()

  function updateTitle(lang: LangKey, value: string) {
    setTitles((prev) => ({ ...prev, [lang]: value }))
  }

  async function handleSave() {
    setError('')
    const translations = allowedLanguages
      .map((langKey) => ({ langKey, title: (titles[langKey] ?? '').trim() }))
      .filter((t) => t.title)
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
      showToast(isEdit ? 'Tag has been updated' : 'Tag has been created')
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isEdit ? 'save' : 'create'} tag`)
      setLoading(false)
    }
  }

  const isRtl = activeLang === 'fa'

  return (
    <Backdrop onClose={onClose}>
      <ModalPanel>
        <ModalHeader
          title={isEdit ? 'Edit Tag' : 'Create Tag'}
          subtitle={isEdit ? 'Update this tag' : 'Add a new tag to label content'}
          onClose={onClose}
        />

        {allowedLanguages.length > 1 && (
          <div className="flex items-center gap-1 px-6 pt-4" style={{ borderBottom: `1px solid ${theme.border}` }}>
            {allowedLanguages.map((lang) => {
              const isActive = lang === activeLang
              const filled = !!titles[lang]?.trim()
              return (
                <button
                  key={lang} type="button" onClick={() => setActiveLang(lang)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all -mb-px shrink-0"
                  style={isActive
                    ? { color: theme.textPrimary, borderBottom: '2px solid #7c3aed' }
                    : { color: theme.textSecondary, borderBottom: '2px solid transparent' }
                  }
                >
                  {filled && <span className="w-1.5 h-1.5 rounded-full" style={{ background: theme.accent }} />}
                  {LANGUAGE_LABELS[lang]}
                </button>
              )
            })}
          </div>
        )}

        <div className="px-6 py-5 space-y-4">
          {error && <ErrorBanner message={error} />}
          <TextField
            label={allowedLanguages.length > 1 ? `Title (${LANGUAGE_LABELS[activeLang]})` : 'Title'}
            required value={titles[activeLang] ?? ''}
            onChange={(v) => updateTitle(activeLang, v)}
            placeholder="e.g. Breaking"
            dir={isRtl ? 'rtl' : 'ltr'}
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

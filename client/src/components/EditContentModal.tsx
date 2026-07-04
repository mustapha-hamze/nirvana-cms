import { useState } from 'react'
import { api } from '../api/client'
import { theme } from '../theme'
import { TrashIcon } from './icons'
import { Backdrop, ModalHeader, ModalFooter, ErrorBanner, CancelButton, PrimaryButton } from './ui/Modal'
import { TextField, TextAreaField, SelectField } from './ui/FormField'
import ConfirmModal from './ui/ConfirmModal'
import { LANGUAGE_VALUES, LANGUAGE_LABELS, type LangKey, type ContentStatus, type ContentItem } from '../types/content'

type Draft = { title: string; headline: string; abstract: string; status: ContentStatus }

const EMPTY_DRAFT: Draft = { title: '', headline: '', abstract: '', status: 'draft' }

const STATUS_OPTIONS: { value: ContentStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
]

function buildInitialDrafts(content: ContentItem): Partial<Record<LangKey, Draft>> {
  const drafts: Partial<Record<LangKey, Draft>> = {}
  for (const d of content.details) {
    drafts[d.langKey] = { title: d.title, headline: d.headline, abstract: d.abstract, status: d.status }
  }
  return drafts
}

export default function EditContentModal({
  content,
  onClose,
  onSaved,
}: {
  content: ContentItem
  onClose: () => void
  onSaved: () => void
}) {
  const [drafts, setDrafts] = useState<Partial<Record<LangKey, Draft>>>(() => buildInitialDrafts(content))
  const [activeLang, setActiveLang] = useState<LangKey>(content.details[0]?.langKey ?? LANGUAGE_VALUES[0])
  const [removeLang, setRemoveLang] = useState<LangKey | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const draft = drafts[activeLang] ?? EMPTY_DRAFT

  function updateActiveDraft(patch: Partial<Draft>) {
    setDrafts((prev) => ({ ...prev, [activeLang]: { ...(prev[activeLang] ?? EMPTY_DRAFT), ...patch } }))
  }

  async function handleSave() {
    setError('')
    const entries = (Object.entries(drafts) as [LangKey, Draft][]).filter(([, d]) => d.title.trim())
    if (entries.length === 0) {
      setError('At least one language needs a title')
      return
    }
    setLoading(true)
    try {
      await Promise.all(
        entries.map(([langKey, d]) => api.put(`/content/${content._id}/details/${langKey}`, d)),
      )
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save content')
      setLoading(false)
    }
  }

  const isRtl = activeLang === 'fa'

  return (
    <Backdrop onClose={onClose}>
      <div
        className="rounded-2xl shadow-2xl w-full max-w-384 mx-4 overflow-hidden"
        style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
      >
        <ModalHeader title="Edit Content" subtitle="Manage translations for this content" onClose={onClose} />

        {/* Language tabs */}
        <div className="flex items-center gap-1 px-6 pt-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
          {LANGUAGE_VALUES.map((lang) => {
            const active = lang === activeLang
            const langDraft = drafts[lang]
            return (
              <button
                key={lang} type="button" onClick={() => setActiveLang(lang)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all -mb-px shrink-0"
                style={active
                  ? { color: theme.textPrimary, borderBottom: '2px solid #7c3aed' }
                  : { color: theme.textSecondary, borderBottom: '2px solid transparent' }
                }
              >
                {langDraft && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: langDraft.status === 'published' ? theme.success : 'rgba(255,255,255,0.3)' }}
                  />
                )}
                {LANGUAGE_LABELS[lang]}
              </button>
            )
          })}
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && <ErrorBanner message={error} />}
          <TextField
            label="Title" required value={draft.title}
            onChange={(v) => updateActiveDraft({ title: v })}
            dir={isRtl ? 'rtl' : 'ltr'}
          />
          <TextField
            label="Headline" value={draft.headline}
            onChange={(v) => updateActiveDraft({ headline: v })}
            dir={isRtl ? 'rtl' : 'ltr'}
          />
          <TextAreaField
            label="Abstract" value={draft.abstract}
            onChange={(v) => updateActiveDraft({ abstract: v })}
            dir={isRtl ? 'rtl' : 'ltr'}
          />
          <SelectField
            label="Status" required value={draft.status}
            onChange={(v) => updateActiveDraft({ status: v })}
            options={STATUS_OPTIONS}
          />

          {drafts[activeLang] && (
            <button
              type="button" onClick={() => setRemoveLang(activeLang)}
              className="flex items-center gap-1.5 text-sm font-medium transition"
              style={{ color: theme.danger }}
              onMouseEnter={(e) => (e.currentTarget.style.color = theme.dangerHover)}
              onMouseLeave={(e) => (e.currentTarget.style.color = theme.danger)}
            >
              <TrashIcon size={14} />
              Remove {LANGUAGE_LABELS[activeLang]} translation
            </button>
          )}
        </div>

        <ModalFooter>
          <CancelButton onClick={onClose} disabled={loading} />
          <PrimaryButton onClick={handleSave} disabled={loading}>
            {loading ? 'Saving…' : 'Save Changes'}
          </PrimaryButton>
        </ModalFooter>
      </div>

      {removeLang && (
        <ConfirmModal
          title={`Remove ${LANGUAGE_LABELS[removeLang]} translation?`}
          message="This translation will be removed from this content. This action cannot be undone."
          confirmLabel="Remove Translation"
          loadingLabel="Removing…"
          onConfirm={async () => {
            await api.delete(`/content/${content._id}/details/${removeLang}`)
            setDrafts((prev) => {
              const next = { ...prev }
              delete next[removeLang]
              return next
            })
            onSaved()
          }}
          onClose={() => setRemoveLang(null)}
        />
      )}
    </Backdrop>
  )
}

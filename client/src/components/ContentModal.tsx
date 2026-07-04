import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { theme } from '../theme'
import { TrashIcon, PlusIcon, ChevronIcon, CloseIcon } from './icons'
import { Backdrop, ModalPanel, ModalHeader, ModalFooter, ErrorBanner, CancelButton, PrimaryButton } from './ui/Modal'
import { TextField, TextAreaField } from './ui/FormField'
import StatusToggle from './ui/StatusToggle'
import ConfirmModal from './ui/ConfirmModal'
import { useAppSelector } from '../store/hooks'
import { selectUser } from '../store/authSlice'
import { isAppAdmin } from '../utils/permissions'
import type { Category } from '../types/category'
import type { Tag } from '../types/tag'
import {
  LANGUAGE_VALUES, LANGUAGE_LABELS, type LangKey, type ContentStatus,
  type ContentItem, type ContentDetail, type ContentMetadata,
} from '../types/content'

type Draft = { title: string; headline: string; abstract: string; status: ContentStatus; metadata: ContentMetadata }

const EMPTY_METADATA: ContentMetadata = { keywords: [], author: '', description: '' }
const EMPTY_DRAFT: Draft = { title: '', headline: '', abstract: '', status: 'draft', metadata: EMPTY_METADATA }

function buildInitialDrafts(content: ContentItem | null): Partial<Record<LangKey, Draft>> {
  const drafts: Partial<Record<LangKey, Draft>> = {}
  if (!content) return drafts
  for (const d of content.details) {
    drafts[d.langKey] = { title: d.title, headline: d.headline, abstract: d.abstract, status: d.status, metadata: d.metadata }
  }
  return drafts
}

function KeywordsField({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const [input, setInput] = useState('')

  function commit() {
    const trimmed = input.trim()
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed])
    setInput('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: theme.textSecondary }}>
        Keywords
      </label>
      <div
        className="w-full px-3 py-2 rounded-xl flex flex-wrap items-center gap-1.5"
        style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}` }}
      >
        {value.map((kw) => (
          <span
            key={kw}
            className="flex items-center gap-1 text-xs font-medium pl-2 pr-1.5 py-1 rounded-full"
            style={{ background: theme.accentBg, color: theme.accent }}
          >
            {kw}
            <button type="button" onClick={() => onChange(value.filter((k) => k !== kw))} className="leading-none">
              <CloseIcon size={11} />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          placeholder={value.length === 0 ? 'Type a keyword and press Enter…' : ''}
          className="flex-1 min-w-24 bg-transparent outline-none text-sm py-1"
          style={{ color: theme.textPrimary }}
        />
      </div>
    </div>
  )
}

export default function ContentModal({
  applicationId,
  allowedLanguages,
  content,
  onClose,
  onSaved,
}: {
  applicationId: string
  allowedLanguages: LangKey[]
  content: ContentItem | null
  onClose: () => void
  onSaved: () => void
}) {
  // Tracks the created/persisted content across saves — starts as the `content` prop
  // (null when creating) and is updated in place as saves succeed, so the modal can
  // stay open and transition from "create" to "edit" without the parent remounting it.
  const [savedContent, setSavedContent] = useState<ContentItem | null>(content)
  const isEdit = savedContent !== null
  const user = useAppSelector(selectUser)
  const canManage = isAppAdmin(user, applicationId)
  const [drafts, setDrafts] = useState<Partial<Record<LangKey, Draft>>>(() => buildInitialDrafts(content))
  const [activeLang, setActiveLang] = useState<LangKey | null>(content?.details[0]?.langKey ?? null)
  const [removeLang, setRemoveLang] = useState<LangKey | null>(null)
  const [metadataOpen, setMetadataOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Categories/tags are shared across every language of this content (see Content
  // model), so they live outside the per-language tabs, not inside them.
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    () => (content?.categories ?? []).map((c) => c._id),
  )
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    () => (content?.tags ?? []).map((t) => t._id),
  )

  useEffect(() => {
    // Categories/tags are admin-only end to end — a ContentCreator can't read
    // these endpoints (403), so don't even ask.
    if (!canManage) return
    api.get<Category[]>(`/categories?application=${applicationId}`).then(setCategories).catch(() => {})
    api.get<Tag[]>(`/tags?application=${applicationId}`).then(setTags).catch(() => {})
  }, [applicationId, canManage])

  function toggleCategory(id: string) {
    setSelectedCategoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function toggleTag(id: string) {
    setSelectedTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const existingLangs = LANGUAGE_VALUES.filter((lang) => drafts[lang])
  const availableLangs = allowedLanguages.filter((lang) => !drafts[lang])
  const isPersisted = (lang: LangKey) => savedContent?.details.some((d) => d.langKey === lang) ?? false

  const draft = (activeLang && drafts[activeLang]) || EMPTY_DRAFT

  function updateActiveDraft(patch: Partial<Draft>) {
    if (!activeLang) return
    setDrafts((prev) => ({ ...prev, [activeLang]: { ...(prev[activeLang] ?? EMPTY_DRAFT), ...patch } }))
  }

  function handleAddLanguage(lang: LangKey) {
    setDrafts((prev) => ({ ...prev, [lang]: { ...EMPTY_DRAFT } }))
    setActiveLang(lang)
  }

  function handleDiscardDraft(lang: LangKey) {
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[lang]
      return next
    })
    setActiveLang(null)
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
      if (savedContent) {
        // Category/tag assignment is admin-only server-side — a ContentCreator
        // can't call this endpoint at all, so skip it entirely rather than send a
        // request that would 403 and fail the whole save.
        const [updatedContent, updatedDetails] = await Promise.all([
          canManage
            ? api.put<ContentItem>(`/content/${savedContent._id}`, { categories: selectedCategoryIds, tags: selectedTagIds })
            : null,
          Promise.all(entries.map(([langKey, d]) => api.put<ContentDetail>(`/content/${savedContent._id}/details/${langKey}`, d))),
        ])
        setSavedContent((prev) => {
          if (!prev) return prev
          const byLang = new Map(prev.details.map((d) => [d.langKey, d]))
          for (const d of updatedDetails) byLang.set(d.langKey, d)
          return {
            ...prev,
            categories: updatedContent ? updatedContent.categories : prev.categories,
            tags: updatedContent ? updatedContent.tags : prev.tags,
            details: [...byLang.values()],
          }
        })
      } else {
        const created = await api.post<ContentItem>('/content', {
          application: applicationId,
          categories: selectedCategoryIds,
          tags: selectedTagIds,
          details: entries.map(([langKey, d]) => ({ langKey, ...d })),
        })
        setSavedContent(created)
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isEdit ? 'save' : 'create'} content`)
    } finally {
      setLoading(false)
    }
  }

  const isRtl = activeLang === 'fa'

  return (
    <Backdrop onClose={onClose}>
      <ModalPanel maxWidth="max-w-384">
        <ModalHeader
          title={isEdit ? 'Edit Content' : 'Create Content'}
          subtitle={isEdit ? 'Manage translations for this content' : 'Add one or more languages, then create'}
          onClose={onClose}
        />

        {/* Categories/Tags — admin-only, shared across every language, so they sit above the tabs */}
        {canManage && (
          <div className="px-6 pt-5 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: theme.textSecondary }}>
                Categories
              </label>
              {categories.length === 0 ? (
                <p className="text-sm" style={{ color: theme.textTertiary }}>
                  No categories yet.{' '}
                  <Link to={`/applications/${applicationId}/categories`} className="underline" style={{ color: theme.accent }}>
                    Create one
                  </Link>
                  .
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const selected = selectedCategoryIds.includes(cat._id)
                    return (
                      <button
                        key={cat._id} type="button" onClick={() => toggleCategory(cat._id)}
                        className="px-3.5 py-1.5 rounded-full text-sm font-medium transition"
                        style={selected
                          ? { background: theme.accentBg, border: '1px solid rgba(124,58,237,0.5)', color: theme.accent }
                          : { background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textSecondary }
                        }
                      >
                        {cat.title}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: theme.textSecondary }}>
                Tags
              </label>
              {tags.length === 0 ? (
                <p className="text-sm" style={{ color: theme.textTertiary }}>
                  No tags yet.{' '}
                  <Link to={`/applications/${applicationId}/tags`} className="underline" style={{ color: theme.accent }}>
                    Create one
                  </Link>
                  .
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const selected = selectedTagIds.includes(tag._id)
                    return (
                      <button
                        key={tag._id} type="button" onClick={() => toggleTag(tag._id)}
                        className="px-3.5 py-1.5 rounded-full text-sm font-medium transition"
                        style={selected
                          ? { background: theme.accentBg, border: '1px solid rgba(124,58,237,0.5)', color: theme.accent }
                          : { background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textSecondary }
                        }
                      >
                        {tag.title}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Language tabs */}
        <div className="flex items-center gap-1 px-6 pt-4" style={{ borderBottom: `1px solid ${theme.border}` }}>
          {existingLangs.map((lang) => {
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
          {availableLangs.length > 0 && (
            <button
              type="button" onClick={() => setActiveLang(null)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all -mb-px shrink-0"
              style={activeLang === null
                ? { color: theme.textPrimary, borderBottom: '2px solid #7c3aed' }
                : { color: theme.textSecondary, borderBottom: '2px solid transparent' }
              }
            >
              <PlusIcon size={14} />
              New Language
            </button>
          )}
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && <ErrorBanner message={error} />}
          {activeLang === null ? (
            <div className="space-y-3">
              <p className="text-sm" style={{ color: theme.textSecondary }}>
                Select a language to add a translation for:
              </p>
              <div className="flex flex-wrap gap-2">
                {availableLangs.map((lang) => (
                  <button
                    key={lang} type="button" onClick={() => handleAddLanguage(lang)}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition"
                    style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textPrimary }}
                  >
                    {LANGUAGE_LABELS[lang]}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
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
              {/* SEO/byline — per language, collapsed by default to keep the form simple */}
              <div>
                <button
                  type="button" onClick={() => setMetadataOpen((v) => !v)}
                  className="flex items-center gap-1.5 text-sm font-medium transition"
                  style={{ color: theme.textSecondary }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = theme.textPrimary)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = theme.textSecondary)}
                >
                  <ChevronIcon open={metadataOpen} size={14} />
                  SEO &amp; Metadata
                </button>
                {metadataOpen && (
                  <div className="mt-4 space-y-4">
                    <TextField
                      label="Author" value={draft.metadata.author}
                      onChange={(v) => updateActiveDraft({ metadata: { ...draft.metadata, author: v } })}
                      placeholder="e.g. Jane Doe"
                      dir={isRtl ? 'rtl' : 'ltr'}
                    />
                    <TextAreaField
                      label="Meta Description" value={draft.metadata.description}
                      onChange={(v) => updateActiveDraft({ metadata: { ...draft.metadata, description: v } })}
                      placeholder="Shown in search engine results…"
                      dir={isRtl ? 'rtl' : 'ltr'}
                    />
                    <KeywordsField
                      value={draft.metadata.keywords}
                      onChange={(keywords) => updateActiveDraft({ metadata: { ...draft.metadata, keywords } })}
                    />
                  </div>
                )}
              </div>

              <div style={{ borderTop: `1px solid ${theme.border}` }} />

              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: theme.textSecondary }}>
                    Status
                  </label>
                  <div className="flex items-center gap-2">
                    {canManage && (
                      <StatusToggle
                        checked={draft.status === 'published'}
                        onToggle={() => updateActiveDraft({ status: draft.status === 'published' ? 'draft' : 'published' })}
                        onLabel="Publish"
                        offLabel="Unpublish"
                      />
                    )}
                    <span
                      className="text-sm font-medium"
                      style={{ color: draft.status === 'published' ? theme.success : theme.textSecondary }}
                    >
                      {draft.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>

                {isPersisted(activeLang) ? (
                  canManage && (
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
                  )
                ) : (
                  <button
                    type="button" onClick={() => handleDiscardDraft(activeLang)}
                    className="flex items-center gap-1.5 text-sm font-medium transition"
                    style={{ color: theme.textSecondary }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = theme.textPrimary)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = theme.textSecondary)}
                  >
                    <TrashIcon size={14} />
                    Discard {LANGUAGE_LABELS[activeLang]} draft
                  </button>
                )}
              </div>

              <div style={{ borderTop: `1px solid ${theme.border}` }} />
            </>
          )}
        </div>

        <ModalFooter>
          <CancelButton onClick={onClose} disabled={loading} />
          <PrimaryButton onClick={handleSave} disabled={loading}>
            {loading ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save Changes' : 'Create Content')}
          </PrimaryButton>
        </ModalFooter>
      </ModalPanel>

      {removeLang && savedContent && (
        <ConfirmModal
          title={`Remove ${LANGUAGE_LABELS[removeLang]} translation?`}
          message="This translation will be removed from this content. This action cannot be undone."
          confirmLabel="Remove Translation"
          loadingLabel="Removing…"
          onConfirm={async () => {
            await api.delete(`/content/${savedContent._id}/details/${removeLang}`)
            setDrafts((prev) => {
              const next = { ...prev }
              delete next[removeLang]
              return next
            })
            setSavedContent((prev) => prev && { ...prev, details: prev.details.filter((d) => d.langKey !== removeLang) })
            setActiveLang(null)
            onSaved()
          }}
          onClose={() => setRemoveLang(null)}
        />
      )}
    </Backdrop>
  )
}

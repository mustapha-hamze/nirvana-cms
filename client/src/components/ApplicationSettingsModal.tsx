import { useState, useEffect, useRef, type FormEvent, type ChangeEvent, type ReactNode } from 'react'
import { api, uploadLogo } from '../api/client'
import { theme } from '../theme'
import { EyeIcon, EyeOffIcon, Spinner } from './icons'
import { Backdrop, ModalHeader, ErrorBanner } from './ui/Modal'
import { useToast } from './ui/useToast'
import type { Application } from '../types/application'
import { LANGUAGE_VALUES, LANGUAGE_LABELS, type LangKey } from '../types/content'

type AppSettings = {
  domain: string
  aiApiKey: string
  googleAnalyticsScript: string
  languages: LangKey[]
}

type Props = {
  app: Application
  onClose: () => void
  onSaved: () => void
}

const inputStyle = {
  background: theme.inputBg,
  border: `1px solid ${theme.inputBorder}`,
  color: theme.textPrimary,
}

export default function ApplicationSettingsModal({ app, onClose, onSaved }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(app.logo)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [appForm, setAppForm] = useState({ name: app.name, description: app.description })
  const [settings, setSettings] = useState<AppSettings>({ domain: '', aiApiKey: '', googleAnalyticsScript: '', languages: LANGUAGE_VALUES })
  const [showApiKey, setShowApiKey] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { showToast } = useToast()

  useEffect(() => {
    api.get<AppSettings>(`/applications/${app._id}/settings`)
      .then((s) => setSettings({
        domain: s.domain ?? '',
        aiApiKey: s.aiApiKey ?? '',
        googleAnalyticsScript: s.googleAnalyticsScript ?? '',
        languages: s.languages?.length ? s.languages : LANGUAGE_VALUES,
      }))
      .catch(() => {/* no settings yet */})
      .finally(() => setLoading(false))
  }, [app._id])

  function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  function toggleLanguage(lang: LangKey) {
    setSettings((p) => {
      const has = p.languages.includes(lang)
      if (has && p.languages.length === 1) return p
      return {
        ...p,
        languages: has ? p.languages.filter((l) => l !== lang) : [...p.languages, lang],
      }
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await Promise.all([
        api.put(`/applications/${app._id}`, appForm),
        api.put(`/applications/${app._id}/settings`, settings),
        logoFile ? uploadLogo(app._id, logoFile) : Promise.resolve(),
      ])
      showToast('Application settings saved')
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  function focusBorder(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    e.currentTarget.style.borderColor = 'rgba(124,58,237,0.7)'
  }
  function blurBorder(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    e.currentTarget.style.borderColor = theme.inputBorder
  }

  return (
    <Backdrop onClose={onClose}>
      <div
        className="rounded-2xl shadow-2xl w-full max-w-5xl mx-4 overflow-hidden"
        style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
      >
        <ModalHeader title="Application Settings" subtitle={app.name} onClose={onClose} />

        {/* No internal scroll container — the modal grows with its content
            and the page (Backdrop) scrolls, same as ContentModal. */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner style={{ color: theme.accent }} />
          </div>
        ) : (
          <form id="settings-form" onSubmit={handleSubmit}>
            <div className="px-6 py-5 space-y-6">
              {error && <ErrorBanner message={error} />}

              {/* ── Appearance ──────────────────────────────────── */}
              <section>
                <SectionLabel>Appearance</SectionLabel>

                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-16 h-16 rounded-2xl shrink-0 flex items-center justify-center overflow-hidden"
                    style={logoPreview
                      ? { border: `1px solid ${theme.border}` }
                      : { background: theme.accentGradientDiag }
                    }
                  >
                    {logoPreview
                      ? <img src={logoPreview} alt="logo" className="w-full h-full object-cover" />
                      : <span className="text-white font-bold text-2xl">{app.name[0]?.toUpperCase()}</span>
                    }
                  </div>
                  <div>
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="text-sm font-medium transition"
                      style={{ color: theme.accent }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = theme.accentHover)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = theme.accent)}>
                      Upload logo
                    </button>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      PNG · 1024×1024px · max 300 KB
                    </p>
                    <input ref={fileInputRef} type="file" accept="image/png" className="hidden" onChange={handleLogoChange} />
                  </div>
                </div>

                <Field label="Name" required>
                  <input type="text" value={appForm.name} required
                    onChange={(e) => setAppForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition"
                    style={inputStyle}
                    onFocus={focusBorder} onBlur={blurBorder}
                  />
                </Field>

                <Field label="Description">
                  <textarea value={appForm.description} rows={2}
                    onChange={(e) => setAppForm((p) => ({ ...p, description: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm resize-none outline-none transition"
                    style={inputStyle}
                    onFocus={focusBorder} onBlur={blurBorder}
                  />
                </Field>
              </section>

              {/* ── General ─────────────────────────────────────── */}
              <section>
                <SectionLabel>General</SectionLabel>
                <Field label="Domain">
                  <input type="text" value={settings.domain} placeholder="e.g. acme.com"
                    onChange={(e) => setSettings((p) => ({ ...p, domain: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition"
                    style={inputStyle}
                    onFocus={focusBorder} onBlur={blurBorder}
                  />
                </Field>

                <Field label="Languages" required>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGE_VALUES.map((lang) => {
                      const active = settings.languages.includes(lang)
                      return (
                        <button
                          key={lang} type="button" onClick={() => toggleLanguage(lang)}
                          className="px-3.5 py-2 rounded-xl text-sm font-medium transition"
                          style={active
                            ? { background: theme.accentBg, border: '1px solid rgba(124,58,237,0.5)', color: theme.accent }
                            : { ...inputStyle, color: theme.textSecondary }
                          }
                        >
                          {LANGUAGE_LABELS[lang]}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Content for this application can only be created in these languages.
                  </p>
                </Field>
              </section>

              {/* ── Integrations ────────────────────────────────── */}
              <section>
                <SectionLabel>Integrations</SectionLabel>

                <Field label="AI API Key">
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={settings.aiApiKey} placeholder="sk-…"
                      onChange={(e) => setSettings((p) => ({ ...p, aiApiKey: e.target.value }))}
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm outline-none transition"
                      style={inputStyle}
                      onFocus={focusBorder} onBlur={blurBorder}
                    />
                    <button type="button" onClick={() => setShowApiKey((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition"
                      style={{ color: 'rgba(255,255,255,0.3)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = theme.textSecondary)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>
                      {showApiKey ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                    </button>
                  </div>
                </Field>

                <Field label="Google Analytics Script">
                  <textarea
                    value={settings.googleAnalyticsScript} rows={4}
                    placeholder={'<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>…'}
                    onChange={(e) => setSettings((p) => ({ ...p, googleAnalyticsScript: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs resize-none outline-none transition font-mono"
                    style={inputStyle}
                    onFocus={focusBorder} onBlur={blurBorder}
                  />
                </Field>
              </section>
            </div>
          </form>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4"
          style={{ borderTop: `1px solid ${theme.border}` }}
        >
          <button type="button" onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition"
            style={{ color: theme.textSecondary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
              e.currentTarget.style.color = theme.textPrimary
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = theme.textSecondary
            }}>
            Cancel
          </button>
          <button type="submit" form="settings-form" disabled={saving || loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60"
            style={{ background: theme.accentGradient, boxShadow: '0 2px 12px rgba(124,58,237,0.35)' }}>
            {saving && <Spinner style={{ color: 'rgba(255,255,255,0.7)' }} />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Backdrop>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
        {children}
      </span>
      <div className="flex-1 h-px" style={{ background: theme.border }} />
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="mb-3">
      <label className="block text-sm font-medium mb-1.5" style={{ color: theme.textSecondary }}>
        {label}{required && <span style={{ color: theme.danger }} className="ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

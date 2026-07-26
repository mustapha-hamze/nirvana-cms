import { toast } from 'sonner'
import { useState, useEffect, useRef, type FormEvent, type ChangeEvent, type ReactNode } from 'react'
import { api, uploadLogo } from '../api/client'
import { EyeIcon, EyeOffIcon, Spinner } from './icons'
import { Backdrop, ModalPanel, ModalHeader, ErrorBanner, CancelButton, PrimaryButton } from './ui/Modal'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
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
      toast.success('Application settings have been saved')
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Backdrop onClose={onClose}>
      <ModalPanel maxWidth="max-w-5xl">
        <ModalHeader title="Application Settings" subtitle={app.name} />

        {/* No internal scroll container — the modal grows with its content
            and the page (Backdrop) scrolls, same as ContentModal. */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="text-primary" />
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
                    className={`w-16 h-16 rounded-2xl shrink-0 flex items-center justify-center overflow-hidden ${logoPreview ? 'border' : ''}`}
                    style={logoPreview ? undefined : { background: 'var(--color-accent-gradient-diag)' }}
                  >
                    {logoPreview
                      ? <img src={logoPreview} alt="logo" className="w-full h-full object-cover" />
                      : <span className="text-white font-bold text-2xl">{app.name[0]?.toUpperCase()}</span>
                    }
                  </div>
                  <div>
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-auto p-0 text-sm font-medium"
                    >
                      Upload logo
                    </Button>
                    <p className="text-xs mt-0.5 text-(--color-text-tertiary)">
                      PNG · 1024×1024px · max 300 KB
                    </p>
                    <input ref={fileInputRef} type="file" accept="image/png" className="hidden" onChange={handleLogoChange} />
                  </div>
                </div>

                <Field label="App Key">
                  <Input type="text" value={app.appKey} readOnly disabled className="font-mono" />
                  <p className="text-xs mt-1.5 text-(--color-text-tertiary)">
                    Auto-generated and read-only.
                  </p>
                </Field>

                <Field label="Name" required>
                  <Input
                    type="text" value={appForm.name} required
                    onChange={(e) => setAppForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </Field>

                <Field label="Description">
                  <Textarea
                    value={appForm.description} rows={2}
                    onChange={(e) => setAppForm((p) => ({ ...p, description: e.target.value }))}
                  />
                </Field>
              </section>

              {/* ── General ─────────────────────────────────────── */}
              <section>
                <SectionLabel>General</SectionLabel>
                <Field label="Domain">
                  <Input
                    type="text" value={settings.domain} placeholder="e.g. acme.com"
                    onChange={(e) => setSettings((p) => ({ ...p, domain: e.target.value }))}
                  />
                </Field>

                <Field label="Languages" required>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGE_VALUES.map((lang) => {
                      const active = settings.languages.includes(lang)
                      return (
                        <Button
                          key={lang}
                          type="button"
                          variant={active ? 'default' : 'outline'}
                          onClick={() => toggleLanguage(lang)}
                          className="rounded-xl"
                        >
                          {LANGUAGE_LABELS[lang]}
                        </Button>
                      )
                    })}
                  </div>
                  <p className="text-xs mt-1.5 text-(--color-text-tertiary)">
                    Content for this application can only be created in these languages.
                  </p>
                </Field>
              </section>

              {/* ── Integrations ────────────────────────────────── */}
              <section>
                <SectionLabel>Integrations</SectionLabel>

                <Field label="AI API Key">
                  <div className="relative">
                    <Input
                      type={showApiKey ? 'text' : 'password'}
                      value={settings.aiApiKey} placeholder="sk-…"
                      onChange={(e) => setSettings((p) => ({ ...p, aiApiKey: e.target.value }))}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setShowApiKey((v) => !v)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showApiKey ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                    </Button>
                  </div>
                </Field>

                <Field label="Google Analytics Script">
                  <Textarea
                    value={settings.googleAnalyticsScript} rows={4}
                    placeholder={'<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>…'}
                    onChange={(e) => setSettings((p) => ({ ...p, googleAnalyticsScript: e.target.value }))}
                    className="text-xs font-mono"
                  />
                </Field>
              </section>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
          <CancelButton onClick={onClose} disabled={saving || loading} />
          <PrimaryButton type="submit" formId="settings-form" disabled={saving || loading}>
            {saving && <Spinner className="text-primary-foreground/70" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </PrimaryButton>
        </div>
      </ModalPanel>
    </Backdrop>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[11px] font-semibold tracking-widest uppercase text-(--color-text-tertiary)">
        {children}
      </span>
      <Separator className="flex-1" />
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="mb-3">
      <Label className="block text-sm font-medium mb-1.5 text-muted-foreground">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}

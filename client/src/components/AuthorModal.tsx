import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Backdrop, ModalPanel, ModalHeader, ModalFooter, ErrorBanner, CancelButton, PrimaryButton } from './ui/Modal'
import { TextField, TextAreaField } from './ui/FormField'
import ImageUploadField from './body/ImageUploadField'
import StatusToggle from './ui/StatusToggle'
import TranslatedTitleTabs from './ui/TranslatedTitleTabs'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { useLocale } from '../i18n/useLocale'
import type { LangKey } from '../types/content'
import type { Author } from '../types/author'

export default function AuthorModal({
  applicationId,
  allowedLanguages,
  author,
  onClose,
  onSaved,
}: {
  applicationId: string
  allowedLanguages: LangKey[]
  author: Author | null
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useLocale()
  const isEdit = author !== null

  const [firstName, setFirstName] = useState(author?.firstName ?? '')
  const [lastName, setLastName] = useState(author?.lastName ?? '')
  const [displayName, setDisplayName] = useState(author?.displayName ?? '')
  // Auto-fills from first/last name until the admin types into the display
  // name field directly — an edit there "locks in" a custom value (e.g. a
  // pen name) instead of it being silently overwritten on the next keystroke.
  const [displayNameEdited, setDisplayNameEdited] = useState(isEdit)
  const [email, setEmail] = useState(author?.email ?? '')
  const [jobTitle, setJobTitle] = useState(author?.jobTitle ?? '')
  const [websiteUrl, setWebsiteUrl] = useState(author?.websiteUrl ?? '')
  const [avatar, setAvatar] = useState(author?.avatar ?? '')
  const [linkedin, setLinkedin] = useState(author?.socialLinks?.linkedin ?? '')
  const [x, setX] = useState(author?.socialLinks?.x ?? '')
  const [instagram, setInstagram] = useState(author?.socialLinks?.instagram ?? '')
  const [bios, setBios] = useState<Partial<Record<LangKey, string>>>(() => {
    const initial: Partial<Record<LangKey, string>> = {}
    for (const tr of author?.translations ?? []) initial[tr.langKey] = tr.bio
    return initial
  })
  const [activeLang, setActiveLang] = useState<LangKey>(author?.translations[0]?.langKey ?? allowedLanguages[0])
  const [active, setActive] = useState(author?.status !== 'inactive')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (displayNameEdited) return
    setDisplayName([firstName, lastName].filter((v) => v.trim()).join(' '))
  }, [firstName, lastName, displayNameEdited])

  async function handleSave() {
    setError('')
    if (!firstName.trim()) {
      setError(t('authors.firstName') + ' ' + t('common.required').toLowerCase())
      return
    }
    setLoading(true)
    try {
      const translations = allowedLanguages
        .map((langKey) => ({ langKey, bio: (bios[langKey] ?? '').trim() }))
        .filter((tr) => tr.bio)
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: displayName.trim(),
        email: email.trim(),
        jobTitle: jobTitle.trim(),
        websiteUrl: websiteUrl.trim(),
        avatar,
        socialLinks: { linkedin: linkedin.trim(), x: x.trim(), instagram: instagram.trim() },
        translations,
        status: active ? 'active' : 'inactive',
      }
      if (author) {
        await api.put(`/authors/${author._id}`, payload)
      } else {
        await api.post('/authors', { application: applicationId, ...payload })
      }
      toast.success(isEdit ? t('authors.toastUpdated') : t('authors.toastCreated'))
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : (isEdit ? t('authors.saveFailed') : t('authors.createFailed')))
      setLoading(false)
    }
  }

  return (
    <Backdrop onClose={onClose}>
      <ModalPanel maxWidth="max-w-xl">
        <ModalHeader
          title={isEdit ? t('authors.modalEditTitle') : t('authors.modalCreateTitle')}
          subtitle={isEdit ? t('authors.modalEditSubtitle') : t('authors.modalCreateSubtitle')}
        />

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && <ErrorBanner message={error} />}

          <div className="grid grid-cols-2 gap-3">
            <TextField label={t('authors.firstName')} required value={firstName} onChange={setFirstName} placeholder={t('authors.firstNamePlaceholder')} />
            <TextField label={t('authors.lastName')} value={lastName} onChange={setLastName} placeholder={t('authors.lastNamePlaceholder')} />
          </div>
          <TextField
            label={t('authors.displayName')}
            value={displayName}
            onChange={(v) => { setDisplayName(v); setDisplayNameEdited(true) }}
            placeholder={t('authors.displayNamePlaceholder')}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField label={t('table.email')} type="email" value={email} onChange={setEmail} placeholder={t('common.emailPlaceholder')} />
            <TextField label={t('authors.jobTitle')} value={jobTitle} onChange={setJobTitle} placeholder={t('authors.jobTitlePlaceholder')} />
          </div>
          <TextField label={t('authors.websiteUrl')} value={websiteUrl} onChange={setWebsiteUrl} placeholder={t('authors.websiteUrlPlaceholder')} />

          <ImageUploadField applicationId={applicationId} url={avatar} onUploaded={setAvatar} label={t('authors.avatar')} domain="author" />

          <Separator />

          <div>
            <Label className="block text-sm font-medium mb-1.5 text-muted-foreground">
              {t('authors.socialLinks')}
            </Label>
            <div className="grid grid-cols-3 gap-3">
              <TextField label={t('authors.linkedin')} value={linkedin} onChange={setLinkedin} placeholder="https://linkedin.com/in/…" />
              <TextField label={t('authors.twitter')} value={x} onChange={setX} placeholder="https://x.com/…" />
              <TextField label={t('authors.instagram')} value={instagram} onChange={setInstagram} placeholder="https://instagram.com/…" />
            </div>
          </div>

          <Separator />

          <div>
            {allowedLanguages.length > 1 && (
              <div className="-mx-6 mb-3">
                <TranslatedTitleTabs allowedLanguages={allowedLanguages} activeLang={activeLang} titles={bios} onSelect={setActiveLang} />
              </div>
            )}
            <TextAreaField
              label={allowedLanguages.length > 1 ? `${t('authors.bio')} (${activeLang.toUpperCase()})` : t('authors.bio')}
              value={bios[activeLang] ?? ''}
              onChange={(v) => setBios((prev) => ({ ...prev, [activeLang]: v }))}
              placeholder={t('authors.bioPlaceholder')}
              rows={4}
            />
          </div>

          <Separator />

          <div>
            <Label className="block text-sm font-medium mb-1.5 text-muted-foreground">
              {t('common.status')}
            </Label>
            <div className="flex items-center gap-2">
              <StatusToggle
                checked={active}
                onToggle={() => setActive((v) => !v)}
                onLabel={t('common.activate')}
                offLabel={t('common.deactivate')}
              />
              <span className={`text-sm font-medium ${active ? 'text-(--color-success)' : 'text-muted-foreground'}`}>
                {active ? t('common.active') : t('common.inactive')}
              </span>
            </div>
          </div>
        </div>
        <ModalFooter>
          <CancelButton onClick={onClose} disabled={loading} />
          <PrimaryButton onClick={handleSave} disabled={loading}>
            {loading ? (isEdit ? t('common.saving') : t('common.creating')) : (isEdit ? t('common.saveChanges') : t('authors.createAuthor'))}
          </PrimaryButton>
        </ModalFooter>
      </ModalPanel>
    </Backdrop>
  )
}

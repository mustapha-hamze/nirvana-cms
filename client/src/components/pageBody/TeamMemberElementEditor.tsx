import { TextField, TextAreaField, SelectField } from '../ui/FormField'
import ImageUploadField from '../body/ImageUploadField'
import { theme } from '../../theme'
import { PlusIcon, TrashIcon } from '../icons'
import type { TeamMemberElement, SocialPlatform } from '../../types/page'
import { SOCIAL_PLATFORM_VALUES, SOCIAL_PLATFORM_LABELS } from '../../constants/pageSections'

const MAX_SOCIAL_LINKS = 6
const PLATFORM_OPTIONS = SOCIAL_PLATFORM_VALUES.map((p) => ({ value: p, label: SOCIAL_PLATFORM_LABELS[p] }))

export default function TeamMemberElementEditor({
  applicationId,
  element,
  onChange,
}: {
  applicationId: string
  element: TeamMemberElement
  onChange: (next: TeamMemberElement) => void
}) {
  function updateLink(index: number, patch: Partial<{ platform: SocialPlatform; url: string }>) {
    const socialLinks = element.socialLinks.slice()
    socialLinks[index] = { ...socialLinks[index], ...patch }
    onChange({ ...element, socialLinks })
  }

  function removeLink(index: number) {
    onChange({ ...element, socialLinks: element.socialLinks.filter((_, i) => i !== index) })
  }

  function addLink() {
    onChange({ ...element, socialLinks: [...element.socialLinks, { platform: 'website', url: '' }] })
  }

  return (
    <div className="space-y-3">
      <ImageUploadField domain="page" applicationId={applicationId} url={element.photo} onUploaded={(photo) => onChange({ ...element, photo })} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Name" required value={element.name} onChange={(name) => onChange({ ...element, name })} />
        <TextField label="Role" value={element.role} onChange={(role) => onChange({ ...element, role })} placeholder="e.g. Co-founder" />
      </div>
      <TextAreaField label="Bio" value={element.bio} onChange={(bio) => onChange({ ...element, bio })} rows={3} />

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: theme.textSecondary }}>
          Social links ({element.socialLinks.length})
        </label>
        <div className="space-y-2">
          {element.socialLinks.map((link, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-36 shrink-0">
                <SelectField
                  label="Platform"
                  value={link.platform}
                  onChange={(platform) => updateLink(i, { platform })}
                  options={PLATFORM_OPTIONS}
                />
              </div>
              <input
                value={link.url}
                onChange={(e) => updateLink(i, { url: e.target.value })}
                placeholder="https://…"
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none transition"
                style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textPrimary }}
              />
              <button type="button" onClick={() => removeLink(i)} title="Remove" className="p-2 rounded-lg transition shrink-0" style={{ color: theme.danger }}>
                <TrashIcon size={14} />
              </button>
            </div>
          ))}
        </div>
        {element.socialLinks.length < MAX_SOCIAL_LINKS && (
          <button type="button" onClick={addLink} className="flex items-center gap-1.5 text-sm font-medium transition mt-2" style={{ color: theme.accent }}>
            <PlusIcon size={14} /> Add social link
          </button>
        )}
      </div>
    </div>
  )
}

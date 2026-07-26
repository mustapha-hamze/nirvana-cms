import { TextField, TextAreaField, SelectField } from '../ui/FormField'
import ImageUploadField from '../body/ImageUploadField'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
        <Label className="mb-1.5 text-sm font-medium text-muted-foreground">
          Social links ({element.socialLinks.length})
        </Label>
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
              <Input
                value={link.url}
                onChange={(e) => updateLink(i, { url: e.target.value })}
                placeholder="https://…"
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeLink(i)}
                title="Remove"
                className="icon-btn-danger shrink-0 hover:bg-transparent"
              >
                <TrashIcon size={14} />
              </Button>
            </div>
          ))}
        </div>
        {element.socialLinks.length < MAX_SOCIAL_LINKS && (
          <Button type="button" variant="link" onClick={addLink} className="h-auto gap-1.5 p-0 text-sm font-medium mt-2 hover:no-underline">
            <PlusIcon size={14} /> Add social link
          </Button>
        )}
      </div>
    </div>
  )
}

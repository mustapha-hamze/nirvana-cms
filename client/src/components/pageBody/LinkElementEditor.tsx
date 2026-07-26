import { TextField } from '../ui/FormField'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { LinkElement } from '../../types/page'

export default function LinkElementEditor({
  element,
  onChange,
}: {
  element: LinkElement
  onChange: (next: LinkElement) => void
}) {
  return (
    <div className="space-y-3">
      <TextField label="Link URL" required value={element.url} onChange={(url) => onChange({ ...element, url })} placeholder="https://…" />
      <TextField label="Label" required value={element.label} onChange={(label) => onChange({ ...element, label })} placeholder="Read more" />
      <Label className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
        <Checkbox checked={element.newTab} onCheckedChange={(checked) => onChange({ ...element, newTab: checked === true })} />
        Open in a new tab
      </Label>
    </div>
  )
}

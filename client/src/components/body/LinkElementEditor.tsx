import { TextField } from '../ui/FormField'
import { theme } from '../../theme'
import type { LinkElement } from '../../types/content'

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
      <label className="flex items-center gap-2 text-sm" style={{ color: theme.textSecondary }}>
        <input type="checkbox" checked={element.newTab} onChange={(e) => onChange({ ...element, newTab: e.target.checked })} />
        Open in a new tab
      </label>
    </div>
  )
}

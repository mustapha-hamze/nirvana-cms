import { TextField } from '../ui/FormField'
import { theme } from '../../theme'
import type { MapElement } from '../../types/page'

export default function MapElementEditor({
  element,
  onChange,
}: {
  element: MapElement
  onChange: (next: MapElement) => void
}) {
  return (
    <div className="space-y-3">
      <TextField label="Address" value={element.address} onChange={(address) => onChange({ ...element, address })} placeholder="e.g. 123 Main St, Springfield" />
      <TextField
        label="Embed URL"
        value={element.embedUrl}
        onChange={(embedUrl) => onChange({ ...element, embedUrl })}
        placeholder="Paste a Google Maps embed link"
      />
      <p className="text-xs -mt-2" style={{ color: theme.textTertiary }}>
        Preferred when set. Otherwise the coordinates below are used.
      </p>

      <div className="grid grid-cols-3 gap-3">
        <TextField
          label="Latitude" type="number"
          value={element.latitude === null ? '' : String(element.latitude)}
          onChange={(v) => onChange({ ...element, latitude: v === '' ? null : Number(v) })}
          placeholder="e.g. 35.6892"
        />
        <TextField
          label="Longitude" type="number"
          value={element.longitude === null ? '' : String(element.longitude)}
          onChange={(v) => onChange({ ...element, longitude: v === '' ? null : Number(v) })}
          placeholder="e.g. 51.3890"
        />
        <TextField
          label="Zoom" type="number"
          value={String(element.zoom)}
          onChange={(v) => onChange({ ...element, zoom: v === '' ? 14 : Number(v) })}
        />
      </div>
    </div>
  )
}

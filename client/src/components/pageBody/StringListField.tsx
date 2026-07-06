import { theme } from '../../theme'
import { PlusIcon, TrashIcon } from '../icons'

// Plain add/remove list of short strings — used where order doesn't carry
// enough weight to justify drag-and-drop (a pricing plan's feature bullets, a
// chart's axis labels). Editing the text back into the order you want is
// simple enough that dnd-kit would be machinery for its own sake here.
export default function StringListField({
  label,
  values,
  onChange,
  placeholder,
  max = 20,
}: {
  label: string
  values: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  max?: number
}) {
  function updateAt(index: number, value: string) {
    const next = values.slice()
    next[index] = value
    onChange(next)
  }

  function removeAt(index: number) {
    onChange(values.filter((_, i) => i !== index))
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: theme.textSecondary }}>
        {label} ({values.length})
      </label>
      <div className="space-y-2">
        {values.map((value, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={value}
              onChange={(e) => updateAt(i, e.target.value)}
              placeholder={placeholder}
              className="flex-1 px-3 py-2 rounded-xl text-sm outline-none transition"
              style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textPrimary }}
            />
            <button
              type="button"
              onClick={() => removeAt(i)}
              title="Remove"
              className="p-2 rounded-lg transition shrink-0"
              style={{ color: theme.danger }}
            >
              <TrashIcon size={14} />
            </button>
          </div>
        ))}
      </div>
      {values.length < max && (
        <button
          type="button"
          onClick={() => onChange([...values, ''])}
          className="flex items-center gap-1.5 text-sm font-medium transition mt-2"
          style={{ color: theme.accent }}
        >
          <PlusIcon size={14} /> Add
        </button>
      )}
    </div>
  )
}

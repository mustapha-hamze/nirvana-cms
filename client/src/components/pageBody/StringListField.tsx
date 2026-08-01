import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PlusIcon, TrashIcon } from '../icons'
import { getTextDirection } from '../../utils/rtl'

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
      <Label className="mb-1.5 text-sm font-medium text-muted-foreground">
        {label} ({values.length})
      </Label>
      <div className="space-y-2">
        {values.map((value, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={value}
              onChange={(e) => updateAt(i, e.target.value)}
              placeholder={placeholder}
              dir={getTextDirection(value)}
              className={cn('flex-1', getTextDirection(value) === 'rtl' && 'rtl-text')}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => removeAt(i)}
              title="Remove"
              className="icon-btn-danger shrink-0 hover:bg-transparent"
            >
              <TrashIcon size={14} />
            </Button>
          </div>
        ))}
      </div>
      {values.length < max && (
        <Button type="button" variant="link" onClick={() => onChange([...values, ''])} className="h-auto gap-1.5 p-0 text-sm font-medium mt-2 hover:no-underline">
          <PlusIcon size={14} /> Add
        </Button>
      )}
    </div>
  )
}

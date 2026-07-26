import { Input } from '@/components/ui/input'
import { SearchIcon } from '../icons'

// Shared search box for admin list pages — debounced search state itself
// lives in useListQuery, this just renders the input.
export default function ListSearchInput({
  value,
  onChange,
  placeholder = 'Search by title or id…',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div className="relative mb-4 max-w-sm">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-tertiary)">
        <SearchIcon size={14} />
      </span>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  )
}

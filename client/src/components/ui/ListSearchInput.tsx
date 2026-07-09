import { theme } from '../../theme'
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
      <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: theme.textTertiary }}>
        <SearchIcon size={14} />
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none transition"
        style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textPrimary }}
      />
    </div>
  )
}

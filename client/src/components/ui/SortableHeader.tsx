import { theme } from '../../theme'
import { ArrowUpIcon, ArrowDownIcon, ArrowUpDownIcon } from '../icons'

export type SortDirection = 'asc' | 'desc'

// A clickable <th> for admin list tables — click toggles direction when
// already the active sort column, or activates this column (with its
// natural default direction) when switching from another one.
export default function SortableHeader({
  label,
  active,
  direction,
  onClick,
  align = 'left',
}: {
  label: string
  active: boolean
  direction: SortDirection
  onClick: () => void
  align?: 'left' | 'right'
}) {
  const restColor = active ? theme.textSecondary : theme.textTertiary

  return (
    <th className={`font-semibold px-5 py-3 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <button
        type="button"
        onClick={onClick}
        className={`flex items-center gap-1 transition ${align === 'right' ? 'ml-auto' : ''}`}
        style={{ color: restColor }}
        onMouseEnter={(e) => (e.currentTarget.style.color = theme.textPrimary)}
        onMouseLeave={(e) => (e.currentTarget.style.color = restColor)}
      >
        {label}
        {active ? (
          direction === 'asc' ? <ArrowUpIcon size={11} /> : <ArrowDownIcon size={11} />
        ) : (
          <ArrowUpDownIcon size={11} />
        )}
      </button>
    </th>
  )
}

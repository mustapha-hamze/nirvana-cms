import { TableHead } from '@/components/ui/table'
import { ArrowUpIcon, ArrowDownIcon, ArrowUpDownIcon } from '../icons'

export type SortDirection = 'asc' | 'desc'

// A clickable table head for admin list tables — click toggles direction when
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
  return (
    <TableHead className={`h-auto px-5 py-3 font-semibold ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <button
        type="button"
        onClick={onClick}
        className={`flex items-center gap-1 transition-colors ${active ? 'text-(--color-text-secondary)' : 'text-(--color-text-tertiary)'} hover:text-(--color-text-primary) ${align === 'right' ? 'ml-auto' : ''}`}
      >
        {label}
        {active ? (
          direction === 'asc' ? <ArrowUpIcon size={11} /> : <ArrowDownIcon size={11} />
        ) : (
          <ArrowUpDownIcon size={11} />
        )}
      </button>
    </TableHead>
  )
}

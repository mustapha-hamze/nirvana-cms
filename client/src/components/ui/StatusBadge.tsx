import { theme } from '../../theme'

// Active/inactive pill used by Tags and Categories' Status column.
export default function StatusBadge({
  active,
  activeLabel = 'active',
  inactiveLabel = 'inactive',
}: {
  active: boolean
  activeLabel?: string
  inactiveLabel?: string
}) {
  return (
    <span
      className="text-[11px] font-semibold px-2 py-1 rounded-full"
      style={active
        ? { background: theme.successBg, color: theme.success }
        : { background: theme.subtleBg, color: theme.textTertiary }
      }
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  )
}

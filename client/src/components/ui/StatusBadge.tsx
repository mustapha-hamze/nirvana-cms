import { Badge } from '@/components/ui/badge'

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
    <Badge variant={active ? 'success' : 'neutral'} className="rounded-full text-[11px] font-semibold">
      {active ? activeLabel : inactiveLabel}
    </Badge>
  )
}

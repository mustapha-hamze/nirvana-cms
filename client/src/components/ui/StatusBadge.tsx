import { Badge } from '@/components/ui/badge'
import { useLocale } from '../../i18n/useLocale'

// Active/inactive pill used by Tags and Categories' Status column.
export default function StatusBadge({
  active,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean
  activeLabel?: string
  inactiveLabel?: string
}) {
  const { t } = useLocale()
  return (
    <Badge variant={active ? 'success' : 'neutral'} className="rounded-full text-[11px] font-semibold">
      {active ? activeLabel ?? t('common.active') : inactiveLabel ?? t('common.inactive')}
    </Badge>
  )
}

import { Badge } from '@/components/ui/badge'
import { useLocale } from '../../i18n/useLocale'
import type { MenuItemAvailability } from '../../types/menu'

// Three-state pill for MenuItem's availability column — no existing badge in
// this codebase has more than two states (StatusBadge is active/inactive
// only), so this is its own small component rather than a StatusBadge prop.
const VARIANT_BY_AVAILABILITY: Record<MenuItemAvailability, 'success' | 'neutral' | 'destructive'> = {
  available: 'success',
  unavailable: 'neutral',
  sold_out: 'destructive',
}

export default function AvailabilityBadge({ availability }: { availability: MenuItemAvailability }) {
  const { t } = useLocale()
  const labelKey = {
    available: 'menuItems.availabilityAvailable',
    unavailable: 'menuItems.availabilityUnavailable',
    sold_out: 'menuItems.availabilitySoldOut',
  } as const
  return (
    <Badge variant={VARIANT_BY_AVAILABILITY[availability]} className="rounded-full text-[11px] font-semibold">
      {t(labelKey[availability])}
    </Badge>
  )
}

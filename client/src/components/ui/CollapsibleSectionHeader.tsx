import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronIcon } from '../icons'

// Collapsible-section trigger shared by every "Body"/"Categories"/"Tags"/
// "SEO & Metadata" toggle in ContentForm/PageForm — chevron + label + an
// optional count pill for how many items are inside.
export default function CollapsibleSectionHeader({
  open,
  onToggle,
  label,
  count,
}: {
  open: boolean
  onToggle: () => void
  label: ReactNode
  count?: number
}) {
  return (
    <Button
      type="button"
      variant="link"
      onClick={onToggle}
      className="h-auto gap-1.5 p-0 text-sm font-medium text-muted-foreground hover:text-foreground hover:no-underline"
    >
      <ChevronIcon open={open} size={14} />
      {label}
      {typeof count === 'number' && count > 0 && (
        <Badge variant="accent" className="text-xs font-semibold">
          {count}
        </Badge>
      )}
    </Button>
  )
}

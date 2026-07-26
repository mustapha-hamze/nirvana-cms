import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Shared edit/delete icon button used in every admin list row — hover color
// comes from the .icon-btn-* CSS classes (index.css), not inline JS handlers.
export default function AdminTableActionButton({
  onClick,
  title,
  variant,
  disabled,
  children,
}: {
  onClick: () => void
  title: string
  variant: 'accent' | 'danger'
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={cn('hover:bg-transparent', `icon-btn-${variant}`)}
    >
      {children}
    </Button>
  )
}

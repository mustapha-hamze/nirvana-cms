import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { PlusIcon } from '../icons'

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 border-(--color-accent-border-soft) bg-(--color-accent-bg-soft) border">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2 text-foreground">
        {title}
      </h3>
      <p className="text-sm mb-6 max-w-xs text-muted-foreground">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>
          <PlusIcon />
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

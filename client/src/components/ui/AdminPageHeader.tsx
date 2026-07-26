import { Button } from '@/components/ui/button'
import { PlusIcon } from '../icons'

// Shared header for admin list pages (Contents, Tags, Pages, Categories) —
// title + item-count subtitle on the left, an optional primary "Create X"
// action on the right.
export default function AdminPageHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  actionDisabled,
}: {
  title: string
  subtitle: string
  actionLabel?: string
  onAction?: () => void
  actionDisabled?: boolean
}) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-1 text-[15px] text-muted-foreground">
          {subtitle}
        </p>
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction} disabled={actionDisabled}>
          <PlusIcon />
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

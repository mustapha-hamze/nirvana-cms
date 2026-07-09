import { theme } from '../../theme'
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
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: theme.textPrimary }}>
          {title}
        </h1>
        <p className="mt-1 text-[15px]" style={{ color: theme.textSecondary }}>
          {subtitle}
        </p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          disabled={actionDisabled}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-60"
          style={{ background: theme.accentGradient, boxShadow: '0 2px 16px rgba(124,58,237,0.35)' }}
        >
          <PlusIcon />
          {actionLabel}
        </button>
      )}
    </div>
  )
}

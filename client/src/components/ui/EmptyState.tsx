import type { ReactNode } from 'react'
import { theme } from '../../theme'
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
  actionLabel: string
  onAction: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: theme.accentBgSoft, border: `1px solid ${theme.accentBorderSoft}` }}
      >
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: theme.textPrimary }}>
        {title}
      </h3>
      <p className="text-sm mb-6 max-w-xs" style={{ color: theme.textSecondary }}>
        {description}
      </p>
      <button
        onClick={onAction}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
        style={{ background: theme.accentGradient, boxShadow: '0 2px 16px rgba(124,58,237,0.3)' }}
      >
        <PlusIcon />
        {actionLabel}
      </button>
    </div>
  )
}

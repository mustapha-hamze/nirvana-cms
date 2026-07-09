import type { ReactNode } from 'react'

// Shared edit/delete icon button used in every admin list row — hover color
// comes from the .icon-btn-* CSS classes (index.css), not inline JS handlers.
export default function AdminTableActionButton({
  onClick,
  title,
  variant,
  children,
}: {
  onClick: () => void
  title: string
  variant: 'accent' | 'danger'
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`p-2 rounded-lg transition-all icon-btn-${variant}`}
    >
      {children}
    </button>
  )
}

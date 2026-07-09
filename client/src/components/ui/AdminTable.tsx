import type { ReactNode } from 'react'
import { theme } from '../../theme'

// Shared table shell for admin list pages — the rounded/bordered surface and
// <table> element. Column headers and rows stay page-specific (they differ
// per list), passed in as children.
export default function AdminTable({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
      <table className="w-full text-sm">{children}</table>
      {footer}
    </div>
  )
}

export function AdminTableRow({ children }: { children: ReactNode }) {
  return (
    <tr className="row-hover" style={{ borderBottom: `1px solid ${theme.border}` }}>
      {children}
    </tr>
  )
}

export function AdminTableHeadCell({ children, align = 'left' }: { children: ReactNode; align?: 'left' | 'right' }) {
  return (
    <th className={`font-semibold px-5 py-3 ${align === 'right' ? 'text-right' : 'text-left'}`} style={{ color: theme.textTertiary }}>
      {children}
    </th>
  )
}

export function EmptyResultsRow({ message }: { message: string }) {
  return (
    <div
      className="rounded-2xl py-16 text-center text-sm"
      style={{ background: theme.surface, border: `1px solid ${theme.border}`, color: theme.textTertiary }}
    >
      {message}
    </div>
  )
}

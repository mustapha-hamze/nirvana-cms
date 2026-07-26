import type { ReactNode } from 'react'
import { Table, TableRow, TableHead } from '@/components/ui/table'

// Shared table shell for admin list pages — the rounded/bordered surface
// wrapping a shadcn Table. Column headers and rows stay page-specific (they
// differ per list), passed in as children.
export default function AdminTable({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden border bg-card">
      <Table>{children}</Table>
      {footer}
    </div>
  )
}

export function AdminTableRow({ children }: { children: ReactNode }) {
  return <TableRow className="row-hover">{children}</TableRow>
}

export function AdminTableHeadCell({ children, align = 'left' }: { children: ReactNode; align?: 'left' | 'right' }) {
  return (
    <TableHead
      className={`h-auto whitespace-normal px-5 py-3 font-semibold text-(--color-text-tertiary) ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      {children}
    </TableHead>
  )
}

export function EmptyResultsRow({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border bg-card py-16 text-center text-sm text-(--color-text-tertiary)">
      {message}
    </div>
  )
}

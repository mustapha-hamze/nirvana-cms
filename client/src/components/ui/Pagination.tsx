import { theme } from '../../theme'
import { ChevronLeftIcon, ChevronRightIcon } from '../icons'

// Shared prev/next pagination footer for admin list tables (Contents, Tags,
// Pages) — deliberately just prev/next + a "X–Y of Z" readout rather than a
// numbered page strip, since these are small per-application lists, not a
// large public catalog that benefits from jumping to an arbitrary page.
export default function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}: {
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (page: number) => void
}) {
  if (total === 0) return null

  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  return (
    <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: `1px solid ${theme.border}` }}>
      <p className="text-xs" style={{ color: theme.textTertiary }}>
        Showing {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          title="Previous page"
          className="p-1.5 rounded-lg transition disabled:opacity-30"
          style={{ color: theme.textSecondary }}
          onMouseEnter={(e) => { if (page > 1) e.currentTarget.style.color = theme.textPrimary }}
          onMouseLeave={(e) => (e.currentTarget.style.color = theme.textSecondary)}
        >
          <ChevronLeftIcon size={15} />
        </button>
        <span className="text-xs font-medium" style={{ color: theme.textSecondary }}>
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          title="Next page"
          className="p-1.5 rounded-lg transition disabled:opacity-30"
          style={{ color: theme.textSecondary }}
          onMouseEnter={(e) => { if (page < totalPages) e.currentTarget.style.color = theme.textPrimary }}
          onMouseLeave={(e) => (e.currentTarget.style.color = theme.textSecondary)}
        >
          <ChevronRightIcon size={15} />
        </button>
      </div>
    </div>
  )
}

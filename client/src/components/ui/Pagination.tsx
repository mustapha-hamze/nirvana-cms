import { Button } from '@/components/ui/button'
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
    <div className="flex items-center justify-between border-t px-5 py-3">
      <p className="text-xs text-muted-foreground">
        Showing {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          title="Previous page"
        >
          <ChevronLeftIcon size={15} />
        </Button>
        <span className="text-xs font-medium text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          title="Next page"
        >
          <ChevronRightIcon size={15} />
        </Button>
      </div>
    </div>
  )
}

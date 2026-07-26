import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export default function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-2xl overflow-hidden border bg-card">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className={cn('flex items-center gap-4 px-5 py-4', i < rows - 1 && 'border-b')}>
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          <Skeleton className="h-3 w-1/4 rounded-lg" />
          <Skeleton className="h-3 w-1/3 rounded-lg" />
          <Skeleton className="h-3 w-1/6 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

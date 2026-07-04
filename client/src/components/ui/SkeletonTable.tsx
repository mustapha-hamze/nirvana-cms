import { theme } from '../../theme'

export default function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
      {[...Array(rows)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-5 py-4"
          style={i < rows - 1 ? { borderBottom: `1px solid ${theme.border}` } : undefined}
        >
          <div className="w-8 h-8 rounded-full shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="h-3 rounded-lg w-1/4" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="h-3 rounded-lg w-1/3" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <div className="h-3 rounded-lg w-1/6" style={{ background: 'rgba(255,255,255,0.04)' }} />
        </div>
      ))}
    </div>
  )
}

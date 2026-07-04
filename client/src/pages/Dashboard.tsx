import { useOutletContext } from 'react-router-dom'
import type { AdminOutletContext } from '../components/AdminLayout'
import { theme } from '../theme'

export default function Dashboard() {
  const { app } = useOutletContext<AdminOutletContext>()

  return (
    <div className="mx-10 my-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: theme.textPrimary }}>
          Dashboard
        </h1>
        <p className="mt-1 text-[15px]" style={{ color: theme.textSecondary }}>
          {app ? `Overview for ${app.name}` : 'Loading application…'}
        </p>
      </div>

      {app && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard
            label="Status"
            value={app.status === 'active' ? 'Active' : 'Inactive'}
            valueColor={app.status === 'active' ? theme.success : 'rgba(255,255,255,0.4)'}
          />
          <StatCard
            label="Created"
            value={new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          />
          <StatCard label="Description" value={app.description || '—'} />
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
    >
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.textTertiary }}>
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold truncate" style={{ color: valueColor ?? theme.textPrimary }}>
        {value}
      </p>
    </div>
  )
}

import { useOutletContext } from 'react-router-dom'
import type { AdminOutletContext } from '../components/AdminLayout'
import { Card, CardContent } from '@/components/ui/card'
import AdminPageHeader from '../components/ui/AdminPageHeader'

export default function Dashboard() {
  const { app } = useOutletContext<AdminOutletContext>()

  return (
    <div className="mx-10 my-10">
      <AdminPageHeader
        title="Dashboard"
        subtitle={app ? `Overview for ${app.name}` : 'Loading application…'}
      />

      {app && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard
            label="Status"
            value={app.status === 'active' ? 'Active' : 'Inactive'}
            valueClassName={app.status === 'active' ? 'text-(--color-success)' : 'text-muted-foreground'}
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

function StatCard({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <Card className="py-5 gap-0">
      <CardContent className="px-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-(--color-text-tertiary)">
          {label}
        </p>
        <p className={`mt-2 text-lg font-semibold truncate ${valueClassName ?? 'text-foreground'}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  )
}

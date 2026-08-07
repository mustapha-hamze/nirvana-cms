import { useOutletContext } from 'react-router-dom'
import type { AdminOutletContext } from '../components/AdminLayout'
import { Card, CardContent } from '@/components/ui/card'
import AdminPageHeader from '../components/ui/AdminPageHeader'
import { useLocale } from '../i18n/useLocale'

export default function Dashboard() {
  const { app } = useOutletContext<AdminOutletContext>()
  const { t } = useLocale()

  return (
    <div className="mx-10 my-10">
      <AdminPageHeader
        title={t('dashboard.title')}
        subtitle={app ? t('dashboard.overviewFor', { name: app.name }) : t('dashboard.loadingApplication')}
      />

      {app && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard
            label={t('dashboard.status')}
            value={app.status === 'active' ? t('common.active') : t('common.inactive')}
            valueClassName={app.status === 'active' ? 'text-(--color-success)' : 'text-muted-foreground'}
          />
          <StatCard
            label={t('dashboard.created')}
            value={new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          />
          <StatCard label={t('dashboard.description')} value={app.description || '—'} />
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

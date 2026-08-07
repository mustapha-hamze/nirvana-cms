import AdminPageHeader from '../components/ui/AdminPageHeader'
import EmptyState from '../components/ui/EmptyState'
import { useLocale } from '../i18n/useLocale'

export default function ComingSoonPage({ title, description }: { title: string; description: string }) {
  const { t } = useLocale()
  return (
    <div className="mx-10 my-10">
      <AdminPageHeader title={title} subtitle={description} />

      <div className="rounded-2xl border bg-card">
        <EmptyState
          icon={<ClockIcon />}
          title={t('comingSoon.title')}
          description={t('comingSoon.description', { title })}
        />
      </div>
    </div>
  )
}

function ClockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none"
      className="text-primary" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

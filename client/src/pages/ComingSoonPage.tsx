import AdminPageHeader from '../components/ui/AdminPageHeader'
import EmptyState from '../components/ui/EmptyState'

export default function ComingSoonPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-10 my-10">
      <AdminPageHeader title={title} subtitle={description} />

      <div className="rounded-2xl border bg-card">
        <EmptyState
          icon={<ClockIcon />}
          title="Coming soon"
          description={`${title} management isn't built yet — check back soon.`}
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

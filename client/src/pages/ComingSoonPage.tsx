import { theme } from '../theme'

export default function ComingSoonPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-10 my-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: theme.textPrimary }}>
          {title}
        </h1>
        <p className="mt-1 text-[15px]" style={{ color: theme.textSecondary }}>
          {description}
        </p>
      </div>

      <div
        className="flex flex-col items-center justify-center py-24 text-center rounded-2xl"
        style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: theme.accentBgSoft, border: `1px solid ${theme.accentBorderSoft}` }}
        >
          <ClockIcon />
        </div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: theme.textPrimary }}>
          Coming soon
        </h3>
        <p className="text-sm max-w-xs" style={{ color: theme.textSecondary }}>
          {title} management isn't built yet — check back soon.
        </p>
      </div>
    </div>
  )
}

function ClockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

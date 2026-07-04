import { useNavigate } from 'react-router-dom'
import { theme } from '../theme'
import { GearIcon, TrashIcon, LoginIcon } from './icons'
import StatusToggle from './ui/StatusToggle'

export type Application = {
  _id: string
  name: string
  description: string
  logo: string | null
  status: 'active' | 'inactive'
  createdAt: string
}

export default function AppCard({
  app,
  onSettings,
  onDelete,
  onToggleStatus,
  toggling,
  toggleError,
}: {
  app: Application
  onSettings: () => void
  onDelete: () => void
  onToggleStatus: () => void
  toggling: boolean
  toggleError?: string
}) {
  const navigate = useNavigate()

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4 transition-all cursor-default group"
      style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
      onMouseEnter={(e) => (e.currentTarget.style.background = theme.surfaceHover)}
      onMouseLeave={(e) => (e.currentTarget.style.background = theme.surface)}
    >
      {/* Top */}
      <div className="flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center overflow-hidden"
          style={app.logo
            ? { border: `1px solid ${theme.border}` }
            : { background: theme.accentGradientDiag }
          }
        >
          {app.logo
            ? <img src={app.logo} alt={app.name} className="w-full h-full object-cover" />
            : <span className="text-white font-bold text-xl">{app.name[0]?.toUpperCase()}</span>
          }
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate" style={{ color: theme.textPrimary }}>{app.name}</h3>
          <p className="text-sm mt-0.5 leading-relaxed line-clamp-2" style={{ color: theme.textSecondary }}>
            {app.description || 'No description'}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span
            className="text-[11px] font-semibold px-2 py-1 rounded-full"
            style={app.status === 'active'
              ? { background: theme.successBg, color: theme.success }
              : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }
            }
          >
            {app.status}
          </span>
          <StatusToggle
            status={app.status} disabled={toggling} onToggle={onToggleStatus}
            activeLabel="Deactivate application" inactiveLabel="Activate application"
          />
        </div>
      </div>

      {toggleError && (
        <p className="text-xs -mt-2" style={{ color: theme.danger }}>{toggleError}</p>
      )}

      {/* Bottom */}
      <div
        className="flex items-center justify-between pt-3"
        style={{ borderTop: `1px solid ${theme.border}` }}
      >
        <span className="text-xs" style={{ color: theme.textTertiary }}>
          {new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onSettings}
            title="Settings"
            aria-label="Settings"
            className="p-2 rounded-lg transition-all"
            style={{ color: theme.accent }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = theme.accentHover
              e.currentTarget.style.background = theme.accentBg
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = theme.accent
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <GearIcon />
          </button>
          <button
            onClick={onDelete}
            title="Delete"
            aria-label="Delete"
            className="p-2 rounded-lg transition-all"
            style={{ color: theme.danger }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = theme.dangerHover
              e.currentTarget.style.background = theme.dangerBgHover
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = theme.danger
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <TrashIcon />
          </button>
          <button
            onClick={() => navigate(`/applications/${app._id}/dashboard`)}
            className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg text-white transition-all active:scale-[0.97] hover:opacity-90"
            style={{ background: theme.accentGradient, boxShadow: '0 2px 10px rgba(124,58,237,0.3)' }}
          >
            <LoginIcon />
            Log in
          </button>
        </div>
      </div>
    </div>
  )
}

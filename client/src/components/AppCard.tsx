import { useNavigate } from 'react-router-dom'
import { GearIcon, TrashIcon, LoginIcon } from './icons'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import StatusToggle from './ui/StatusToggle'
import type { Application } from '../types/application'

export type { Application }

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
    <Card className="cursor-default gap-4 rounded-2xl p-5 py-0 transition-all hover:bg-(--color-surface-hover)">
      {/* Top */}
      <div className="flex items-start gap-4">
        <div
          className={`w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center overflow-hidden ${app.logo ? 'border' : ''}`}
          style={app.logo ? undefined : { background: 'var(--color-accent-gradient-diag)' }}
        >
          {app.logo
            ? <img src={app.logo} alt={app.name} className="w-full h-full object-cover" />
            : <span className="text-white font-bold text-xl">{app.name[0]?.toUpperCase()}</span>
          }
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate text-foreground">{app.name}</h3>
          <p className="text-sm mt-0.5 leading-relaxed line-clamp-2 text-muted-foreground">
            {app.description || 'No description'}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <Badge variant={app.status === 'active' ? 'success' : 'neutral'} className="text-[11px] font-semibold">
            {app.status}
          </Badge>
          <StatusToggle
            checked={app.status === 'active'} disabled={toggling} onToggle={onToggleStatus}
            offLabel="Deactivate application" onLabel="Activate application"
          />
        </div>
      </div>

      {toggleError && (
        <p className="text-xs -mt-2 text-destructive">{toggleError}</p>
      )}

      {/* Bottom */}
      <div className="flex items-center justify-between border-t pt-3 pb-5">
        <span className="text-xs text-(--color-text-tertiary)">
          {new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onSettings}
            title="Settings"
            aria-label="Settings"
            className="icon-btn-accent hover:bg-transparent"
          >
            <GearIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            title="Delete"
            aria-label="Delete"
            className="icon-btn-danger hover:bg-transparent"
          >
            <TrashIcon />
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => navigate(`/applications/${app._id}/dashboard`)}
          >
            <LoginIcon />
            Log in
          </Button>
        </div>
      </div>
    </Card>
  )
}

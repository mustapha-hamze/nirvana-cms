import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { theme } from '../theme'
import { ShieldIcon, PlusIcon } from '../components/icons'
import Layout from '../components/Layout'
import CreateApplicationModal from '../components/CreateApplicationModal'
import ApplicationSettingsModal from '../components/ApplicationSettingsModal'
import AppCard, { type Application } from '../components/AppCard'
import EmptyState from '../components/ui/EmptyState'
import ConfirmModal from '../components/ui/ConfirmModal'

export default function Applications() {
  const navigate = useNavigate()
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [settingsApp, setSettingsApp] = useState<Application | null>(null)
  const [deleteApp, setDeleteApp] = useState<Application | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [toggleErrors, setToggleErrors] = useState<Record<string, string>>({})

  const fetchApps = useCallback(async () => {
    try {
      const data = await api.get<Application[]>('/applications')
      setApps(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchApps() }, [fetchApps])

  async function handleToggleStatus(app: Application) {
    const nextStatus = app.status === 'active' ? 'inactive' : 'active'
    setTogglingId(app._id)
    setToggleErrors((prev) => ({ ...prev, [app._id]: '' }))
    try {
      const updated = await api.patch<Application>(`/applications/${app._id}/status`, { status: nextStatus })
      setApps((prev) => prev.map((a) => (a._id === app._id ? updated : a)))
    } catch (err) {
      setToggleErrors((prev) => ({
        ...prev,
        [app._id]: err instanceof Error ? err.message : 'Failed to update status',
      }))
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: theme.textPrimary }}>
              Applications
            </h1>
            <p className="mt-1 text-[15px]" style={{ color: theme.textSecondary }}>
              {loading ? '…' : `${apps.length} website${apps.length !== 1 ? 's' : ''} managed`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/super-admins')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.97]"
              style={{ color: theme.textPrimary, background: 'rgba(255,255,255,0.06)', border: `1px solid ${theme.border}` }}
            >
              <ShieldIcon />
              Manage Super Admins
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97]"
              style={{ background: theme.accentGradient, boxShadow: '0 2px 16px rgba(124,58,237,0.35)' }}
            >
              <PlusIcon />
              Create Application
            </button>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : apps.length === 0 ? (
          <EmptyState
            icon={<BigGridIcon />}
            title="No applications yet"
            description="Create your first application to start managing content for a website."
            actionLabel="Create Application"
            onAction={() => setShowCreate(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {apps.map((app) => (
              <AppCard
                key={app._id}
                app={app}
                onSettings={() => setSettingsApp(app)}
                onDelete={() => setDeleteApp(app)}
                onToggleStatus={() => handleToggleStatus(app)}
                toggling={togglingId === app._id}
                toggleError={toggleErrors[app._id]}
              />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateApplicationModal onClose={() => setShowCreate(false)} onCreated={fetchApps} />
      )}
      {settingsApp && (
        <ApplicationSettingsModal
          app={settingsApp}
          onClose={() => setSettingsApp(null)}
          onSaved={fetchApps}
        />
      )}
      {deleteApp && (
        <ConfirmModal
          title={`Delete "${deleteApp.name}"?`}
          message="This will remove the application and its settings. Users assigned to it will lose access. This action cannot be undone."
          confirmLabel="Delete Application"
          loadingLabel="Deleting…"
          onConfirm={() => api.delete(`/applications/${deleteApp._id}`).then(fetchApps)}
          onClose={() => setDeleteApp(null)}
        />
      )}
    </Layout>
  )
}

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl p-5 animate-pulse"
      style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 rounded-lg w-2/3" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="h-3 rounded-lg w-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <div className="h-3 rounded-lg w-4/5" style={{ background: 'rgba(255,255,255,0.04)' }} />
        </div>
      </div>
      <div
        className="mt-4 pt-3 flex justify-between"
        style={{ borderTop: `1px solid ${theme.border}` }}
      >
        <div className="h-3 rounded-lg w-20" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="h-3 rounded-lg w-16" style={{ background: 'rgba(255,255,255,0.04)' }} />
      </div>
    </div>
  )
}

function BigGridIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
}

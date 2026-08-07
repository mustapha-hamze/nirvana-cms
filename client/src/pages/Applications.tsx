import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { ShieldIcon, PlusIcon } from '../components/icons'
import Layout from '../components/Layout'
import CreateApplicationModal from '../components/CreateApplicationModal'
import ApplicationSettingsModal from '../components/ApplicationSettingsModal'
import AppCard, { type Application } from '../components/AppCard'
import EmptyState from '../components/ui/EmptyState'
import ConfirmModal from '../components/ui/ConfirmModal'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useLocale } from '../i18n/useLocale'

export default function Applications() {
  const navigate = useNavigate()
  const { t } = useLocale()
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
        [app._id]: err instanceof Error ? err.message : t('common.failedToUpdateStatus'),
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
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t('applications.title')}
            </h1>
            <p className="mt-1 text-[15px] text-muted-foreground">
              {loading ? '…' : t(apps.length === 1 ? 'applications.subtitleOne' : 'applications.subtitleOther', { count: apps.length })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/super-admins')}>
              <ShieldIcon />
              {t('applications.manageSuperAdmins')}
            </Button>
            <Button type="button" onClick={() => setShowCreate(true)}>
              <PlusIcon />
              {t('applications.createApplication')}
            </Button>
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
            title={t('applications.noApplicationsTitle')}
            description={t('applications.noApplicationsDescription')}
            actionLabel={t('applications.createApplication')}
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
          title={t('applications.deleteConfirmTitle', { name: deleteApp.name })}
          message={t('applications.deleteConfirmMessage')}
          confirmLabel={t('applications.deleteConfirmLabel')}
          loadingLabel={t('common.deleting')}
          onConfirm={() => api.delete(`/applications/${deleteApp._id}`).then(fetchApps)}
          onClose={() => setDeleteApp(null)}
        />
      )}
    </Layout>
  )
}

function SkeletonCard() {
  return (
    <Card className="gap-4 rounded-2xl p-5 py-0">
      <div className="flex items-start gap-4">
        <Skeleton className="h-14 w-14 shrink-0 rounded-2xl" />
        <div className="flex-1 space-y-2 pt-1">
          <Skeleton className="h-4 w-2/3 rounded-lg" />
          <Skeleton className="h-3 w-full rounded-lg" />
          <Skeleton className="h-3 w-4/5 rounded-lg" />
        </div>
      </div>
      <div className="flex justify-between border-t pt-3 pb-5">
        <Skeleton className="h-3 w-20 rounded-lg" />
        <Skeleton className="h-3 w-16 rounded-lg" />
      </div>
    </Card>
  )
}

function BigGridIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-primary" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
}

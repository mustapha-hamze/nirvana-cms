import { useEffect, useState, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../api/client'
import type { AdminOutletContext } from '../components/AdminLayout'
import { EditIcon } from '../components/icons'
import CreateAppUserModal from '../components/CreateAppUserModal'
import EditAppUserModal from '../components/EditAppUserModal'
import Avatar from '../components/ui/UserAvatar'
import StatusToggle from '../components/ui/StatusToggle'
import EmptyState from '../components/ui/EmptyState'
import SkeletonTable from '../components/ui/SkeletonTable'
import AdminPageHeader from '../components/ui/AdminPageHeader'
import AdminTable, { AdminTableRow, AdminTableHeadCell } from '../components/ui/AdminTable'
import AdminTableActionButton from '../components/ui/AdminTableActionButton'
import { TableHeader, TableBody } from '@/components/ui/table'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { useLocale } from '../i18n/useLocale'
import type { TranslationKey } from '../i18n/types'

type AppRole = 'WebSiteAdmin' | 'WebSiteContentCreator' | 'WebsiteUser'

type AppUser = {
  _id: string
  name: string
  displayEmail: string
  role: AppRole
  status: 'active' | 'inactive'
  createdAt: string
}

const ROLE_LABEL_KEYS: Record<AppRole, TranslationKey> = {
  WebSiteAdmin: 'appUsers.roleWebSiteAdmin',
  WebSiteContentCreator: 'appUsers.roleContentCreator',
  WebsiteUser: 'appUsers.roleWebsiteUser',
}

const ROLE_BADGE_VARIANT: Record<AppRole, BadgeProps['variant']> = {
  WebSiteAdmin: 'success',
  WebSiteContentCreator: 'info',
  WebsiteUser: 'neutral',
}

export default function AppUsers() {
  const { app } = useOutletContext<AdminOutletContext>()
  const { t } = useLocale()
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editUser, setEditUser] = useState<AppUser | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [toggleErrors, setToggleErrors] = useState<Record<string, string>>({})

  const fetchUsers = useCallback(async () => {
    if (!app) return
    setLoading(true)
    try {
      const data = await api.get<AppUser[]>(`/users?application=${app._id}`)
      setUsers(data)
    } finally {
      setLoading(false)
    }
  }, [app])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function handleToggleStatus(user: AppUser) {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active'
    setTogglingId(user._id)
    setToggleErrors((prev) => ({ ...prev, [user._id]: '' }))
    try {
      const updated = await api.patch<AppUser>(`/users/${user._id}/status`, { status: nextStatus })
      setUsers((prev) => prev.map((u) => (u._id === user._id ? updated : u)))
    } catch (err) {
      setToggleErrors((prev) => ({
        ...prev,
        [user._id]: err instanceof Error ? err.message : t('common.failedToUpdateStatus'),
      }))
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="mx-10 my-10">
      <AdminPageHeader
        title={t('appUsers.title')}
        subtitle={loading || !app ? '…' : t(users.length === 1 ? 'appUsers.subtitleOne' : 'appUsers.subtitleOther', { count: users.length, app: app.name })}
        actionLabel={t('appUsers.createUser')}
        onAction={() => setShowCreate(true)}
        actionDisabled={!app}
      />

      {loading ? (
        <SkeletonTable />
      ) : users.length === 0 ? (
        <EmptyState
          icon={<BigUsersIcon />}
          title={t('appUsers.noUsersTitle')}
          description={t('appUsers.noUsersDescription')}
          actionLabel={t('appUsers.createUser')}
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <AdminTable>
          <TableHeader>
            <tr>
              <AdminTableHeadCell>{t('common.name')}</AdminTableHeadCell>
              <AdminTableHeadCell>{t('table.email')}</AdminTableHeadCell>
              <AdminTableHeadCell>{t('table.role')}</AdminTableHeadCell>
              <AdminTableHeadCell>{t('common.status')}</AdminTableHeadCell>
              <AdminTableHeadCell>{t('table.joined')}</AdminTableHeadCell>
              <AdminTableHeadCell align="end">{t('common.actions')}</AdminTableHeadCell>
            </tr>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <AdminTableRow key={u._id}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} />
                    <span className="font-medium text-foreground">{u.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-muted-foreground" dir="ltr">{u.displayEmail}</td>
                <td className="px-5 py-3">
                  <Badge variant={ROLE_BADGE_VARIANT[u.role]} className="text-[11px] font-semibold">
                    {t(ROLE_LABEL_KEYS[u.role])}
                  </Badge>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <StatusToggle
                      checked={u.status === 'active'}
                      disabled={togglingId === u._id}
                      onToggle={() => handleToggleStatus(u)}
                      offLabel={t('appUsers.deactivateUser')}
                      onLabel={t('appUsers.activateUser')}
                    />
                    <span className={`text-xs ${u.status === 'active' ? 'text-(--color-success)' : 'text-(--color-text-tertiary)'}`}>
                      {u.status === 'active' ? t('common.active') : t('common.inactive')}
                    </span>
                  </div>
                  {toggleErrors[u._id] && (
                    <p className="text-xs mt-1 text-destructive">{toggleErrors[u._id]}</p>
                  )}
                </td>
                <td className="px-5 py-3 text-(--color-text-tertiary)">
                  {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end">
                    <AdminTableActionButton onClick={() => setEditUser(u)} title={t('common.edit')} variant="accent">
                      <EditIcon />
                    </AdminTableActionButton>
                  </div>
                </td>
              </AdminTableRow>
            ))}
          </TableBody>
        </AdminTable>
      )}

      {showCreate && app && (
        <CreateAppUserModal
          applicationId={app._id}
          onClose={() => setShowCreate(false)}
          onCreated={fetchUsers}
        />
      )}
      {editUser && (
        <EditAppUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={fetchUsers}
        />
      )}
    </div>
  )
}

function BigUsersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none"
      className="text-primary" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

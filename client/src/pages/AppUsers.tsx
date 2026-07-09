import { useEffect, useState, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../api/client'
import type { AdminOutletContext } from '../components/AdminLayout'
import { theme } from '../theme'
import { PlusIcon, EditIcon } from '../components/icons'
import CreateAppUserModal from '../components/CreateAppUserModal'
import EditAppUserModal from '../components/EditAppUserModal'
import Avatar from '../components/ui/Avatar'
import StatusToggle from '../components/ui/StatusToggle'
import EmptyState from '../components/ui/EmptyState'
import SkeletonTable from '../components/ui/SkeletonTable'

type AppRole = 'WebSiteAdmin' | 'WebSiteContentCreator' | 'WebsiteUser'

type AppUser = {
  _id: string
  name: string
  displayEmail: string
  role: AppRole
  status: 'active' | 'inactive'
  createdAt: string
}

const ROLE_LABELS: Record<AppRole, string> = {
  WebSiteAdmin: 'Website Admin',
  WebSiteContentCreator: 'Content Creator',
  WebsiteUser: 'Website User',
}

const ROLE_COLORS: Record<AppRole, { bg: string; color: string }> = {
  WebSiteAdmin: { bg: 'rgba(52,211,153,0.1)', color: '#34d399' },
  WebSiteContentCreator: { bg: 'rgba(96,165,250,0.12)', color: '#60a5fa' },
  WebsiteUser: { bg: theme.subtleBg, color: theme.textSubtle },
}

export default function AppUsers() {
  const { app } = useOutletContext<AdminOutletContext>()
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
        [user._id]: err instanceof Error ? err.message : 'Failed to update status',
      }))
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="mx-10 my-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: theme.textPrimary }}>
            Users
          </h1>
          <p className="mt-1 text-[15px]" style={{ color: theme.textSecondary }}>
            {loading || !app
              ? '…'
              : `${users.length} user${users.length !== 1 ? 's' : ''} in ${app.name}`}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          disabled={!app}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-60"
          style={{ background: theme.accentGradient, boxShadow: '0 2px 16px rgba(124,58,237,0.35)' }}
        >
          <PlusIcon />
          Create User
        </button>
      </div>

      {loading ? (
        <SkeletonTable />
      ) : users.length === 0 ? (
        <EmptyState
          icon={<BigUsersIcon />}
          title="No users yet"
          description="Create the first user for this application."
          actionLabel="Create User"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                <th className="text-left font-semibold px-5 py-3" style={{ color: theme.textTertiary }}>Name</th>
                <th className="text-left font-semibold px-5 py-3" style={{ color: theme.textTertiary }}>Email</th>
                <th className="text-left font-semibold px-5 py-3" style={{ color: theme.textTertiary }}>Role</th>
                <th className="text-left font-semibold px-5 py-3" style={{ color: theme.textTertiary }}>Status</th>
                <th className="text-left font-semibold px-5 py-3" style={{ color: theme.textTertiary }}>Joined</th>
                <th className="text-right font-semibold px-5 py-3" style={{ color: theme.textTertiary }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u._id}
                  style={{ borderBottom: `1px solid ${theme.border}` }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = theme.rowHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} />
                      <span className="font-medium" style={{ color: theme.textPrimary }}>{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3" style={{ color: theme.textSecondary }}>{u.displayEmail}</td>
                  <td className="px-5 py-3">
                    <span
                      className="text-[11px] font-semibold px-2 py-1 rounded-full"
                      style={{ background: ROLE_COLORS[u.role].bg, color: ROLE_COLORS[u.role].color }}
                    >
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <StatusToggle
                        checked={u.status === 'active'}
                        disabled={togglingId === u._id}
                        onToggle={() => handleToggleStatus(u)}
                        offLabel="Deactivate user"
                        onLabel="Activate user"
                      />
                      <span className="text-xs" style={{ color: u.status === 'active' ? theme.success : theme.textTertiary }}>
                        {u.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {toggleErrors[u._id] && (
                      <p className="text-xs mt-1" style={{ color: theme.danger }}>{toggleErrors[u._id]}</p>
                    )}
                  </td>
                  <td className="px-5 py-3" style={{ color: theme.textTertiary }}>
                    {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => setEditUser(u)}
                        title="Edit"
                        aria-label="Edit"
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
                        <EditIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
      stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAppSelector } from '../store/hooks'
import { selectUser } from '../store/authSlice'
import { theme } from '../theme'
import { BackIcon, PlusIcon, EditIcon, TrashIcon } from '../components/icons'
import Layout from '../components/Layout'
import CreateSuperAdminModal from '../components/CreateSuperAdminModal'
import EditSuperAdminModal from '../components/EditSuperAdminModal'
import Avatar from '../components/ui/Avatar'
import SkeletonTable from '../components/ui/SkeletonTable'
import ConfirmModal from '../components/ui/ConfirmModal'

type SuperAdminUser = {
  _id: string
  name: string
  displayEmail: string
  createdAt: string
}

export default function SuperAdmins() {
  const navigate = useNavigate()
  const currentUser = useAppSelector(selectUser)
  const [admins, setAdmins] = useState<SuperAdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editAdmin, setEditAdmin] = useState<SuperAdminUser | null>(null)
  const [deleteAdmin, setDeleteAdmin] = useState<SuperAdminUser | null>(null)

  const fetchAdmins = useCallback(async () => {
    try {
      const data = await api.get<SuperAdminUser[]>('/users?role=SuperAdmin')
      setAdmins(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAdmins() }, [fetchAdmins])

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate('/applications')}
          className="flex items-center gap-1.5 text-sm font-medium mb-6 transition"
          style={{ color: theme.textSecondary }}
          onMouseEnter={(e) => (e.currentTarget.style.color = theme.textPrimary)}
          onMouseLeave={(e) => (e.currentTarget.style.color = theme.textSecondary)}
        >
          <BackIcon size={16} />
          Applications
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: theme.textPrimary }}>
              Super Admins
            </h1>
            <p className="mt-1 text-[15px]" style={{ color: theme.textSecondary }}>
              {loading ? '…' : `${admins.length} account${admins.length !== 1 ? 's' : ''} with full platform access`}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97]"
            style={{ background: theme.accentGradient, boxShadow: '0 2px 16px rgba(124,58,237,0.35)' }}
          >
            <PlusIcon />
            Add Super Admin
          </button>
        </div>

        {loading ? (
          <SkeletonTable rows={4} />
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <th className="text-left font-semibold px-5 py-3" style={{ color: theme.textTertiary }}>Name</th>
                  <th className="text-left font-semibold px-5 py-3" style={{ color: theme.textTertiary }}>Email</th>
                  <th className="text-left font-semibold px-5 py-3" style={{ color: theme.textTertiary }}>Joined</th>
                  <th className="text-right font-semibold px-5 py-3" style={{ color: theme.textTertiary }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => {
                  const isSelf = admin._id === currentUser?._id
                  return (
                    <tr
                      key={admin._id}
                      style={{ borderBottom: `1px solid ${theme.border}` }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = theme.rowHover)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={admin.name} />
                          <span className="font-medium" style={{ color: theme.textPrimary }}>
                            {admin.name}
                            {isSelf && (
                              <span className="ml-2 text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
                                style={{ background: theme.accentBg, color: theme.accentHover }}>
                                You
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3" style={{ color: theme.textSecondary }}>{admin.displayEmail}</td>
                      <td className="px-5 py-3" style={{ color: theme.textTertiary }}>
                        {new Date(admin.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditAdmin(admin)}
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
                          <button
                            onClick={() => setDeleteAdmin(admin)}
                            disabled={isSelf}
                            title={isSelf ? "You can't delete your own account" : 'Delete'}
                            aria-label="Delete"
                            className="p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{ color: theme.danger }}
                            onMouseEnter={(e) => {
                              if (isSelf) return
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
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateSuperAdminModal onClose={() => setShowCreate(false)} onCreated={fetchAdmins} />
      )}
      {editAdmin && (
        <EditSuperAdminModal
          admin={editAdmin}
          onClose={() => setEditAdmin(null)}
          onSaved={fetchAdmins}
        />
      )}
      {deleteAdmin && (
        <ConfirmModal
          title={`Delete "${deleteAdmin.name}"?`}
          message="This will permanently revoke their Super Admin access. This action cannot be undone."
          confirmLabel="Delete Super Admin"
          loadingLabel="Deleting…"
          onConfirm={() => api.delete(`/users/${deleteAdmin._id}`).then(fetchAdmins)}
          onClose={() => setDeleteAdmin(null)}
        />
      )}
    </Layout>
  )
}

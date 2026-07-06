import { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../api/client'
import type { AdminOutletContext } from '../components/AdminLayout'
import { theme } from '../theme'
import { PlusIcon, EditIcon, TrashIcon, TagIcon } from '../components/icons'
import TagModal from '../components/TagModal'
import EmptyState from '../components/ui/EmptyState'
import SkeletonTable from '../components/ui/SkeletonTable'
import ConfirmModal from '../components/ui/ConfirmModal'
import { useAppSelector } from '../store/hooks'
import { selectUser } from '../store/authSlice'
import { isAppAdmin } from '../utils/permissions'
import { getPreviewTitle } from '../utils/translations'
import { LANGUAGE_VALUES } from '../types/content'
import type { Tag } from '../types/tag'

export default function Tags() {
  const { app } = useOutletContext<AdminOutletContext>()
  const user = useAppSelector(selectUser)
  const canManage = !!app && isAppAdmin(user, app._id)
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editTag, setEditTag] = useState<Tag | null>(null)
  const [deleteTag, setDeleteTagState] = useState<Tag | null>(null)

  const fetchTags = useCallback(async () => {
    if (!app) return
    setLoading(true)
    try {
      const data = await api.get<Tag[]>(`/tags?application=${app._id}`)
      setTags(data)
    } finally {
      setLoading(false)
    }
  }, [app])

  useEffect(() => { fetchTags() }, [fetchTags])

  return (
    <div className="mx-10 my-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: theme.textPrimary }}>
            Tags
          </h1>
          <p className="mt-1 text-[15px]" style={{ color: theme.textSecondary }}>
            {loading || !app
              ? '…'
              : `${tags.length} tag${tags.length !== 1 ? 's' : ''} in ${app.name}`}
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowCreate(true)}
            disabled={!app}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-60"
            style={{ background: theme.accentGradient, boxShadow: '0 2px 16px rgba(124,58,237,0.35)' }}
          >
            <PlusIcon />
            Create Tag
          </button>
        )}
      </div>

      {loading ? (
        <SkeletonTable />
      ) : tags.length === 0 ? (
        <EmptyState
          icon={<TagIcon size={28} />}
          title="No tags yet"
          description="Label content by creating tags for this application."
          actionLabel={canManage ? 'Create Tag' : undefined}
          onAction={canManage ? () => setShowCreate(true) : undefined}
        />
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                <th className="text-left font-semibold px-5 py-3" style={{ color: theme.textTertiary }}>Title</th>
                <th className="text-left font-semibold px-5 py-3" style={{ color: theme.textTertiary }}>Languages</th>
                <th className="text-left font-semibold px-5 py-3" style={{ color: theme.textTertiary }}>Status</th>
                <th className="text-left font-semibold px-5 py-3" style={{ color: theme.textTertiary }}>Created</th>
                {canManage && (
                  <th className="text-right font-semibold px-5 py-3" style={{ color: theme.textTertiary }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr
                  key={tag._id}
                  style={{ borderBottom: `1px solid ${theme.border}` }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = theme.rowHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="px-5 py-3">
                    <span className="font-medium" style={{ color: theme.textPrimary }}>
                      {getPreviewTitle(tag.translations)}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      {tag.translations.map((t) => (
                        <span
                          key={t.langKey}
                          title={t.title}
                          className="text-[11px] font-semibold px-2 py-1 rounded-full"
                          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}
                        >
                          {t.langKey.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="text-[11px] font-semibold px-2 py-1 rounded-full"
                      style={tag.status === 'active'
                        ? { background: theme.successBg, color: theme.success }
                        : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }
                      }
                    >
                      {tag.status}
                    </span>
                  </td>
                  <td className="px-5 py-3" style={{ color: theme.textTertiary }}>
                    {new Date(tag.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  {canManage && (
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditTag(tag)}
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
                          onClick={() => setDeleteTagState(tag)}
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
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(showCreate || editTag) && app && (
        <TagModal
          applicationId={app._id}
          allowedLanguages={app.languages ?? LANGUAGE_VALUES}
          tag={editTag}
          onClose={() => { setShowCreate(false); setEditTag(null) }}
          onSaved={fetchTags}
        />
      )}
      {deleteTag && (
        <ConfirmModal
          title={`Delete "${getPreviewTitle(deleteTag.translations)}"?`}
          message="This will remove the tag. This action cannot be undone."
          confirmLabel="Delete Tag"
          loadingLabel="Deleting…"
          onConfirm={() => api.delete(`/tags/${deleteTag._id}`).then(fetchTags)}
          onClose={() => setDeleteTagState(null)}
        />
      )}
    </div>
  )
}

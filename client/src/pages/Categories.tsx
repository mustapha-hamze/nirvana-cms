import { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../api/client'
import type { AdminOutletContext } from '../components/AdminLayout'
import { theme } from '../theme'
import { PlusIcon, EditIcon, TrashIcon, GridIcon } from '../components/icons'
import CategoryModal from '../components/CategoryModal'
import EmptyState from '../components/ui/EmptyState'
import SkeletonTable from '../components/ui/SkeletonTable'
import ConfirmModal from '../components/ui/ConfirmModal'
import { useAppSelector } from '../store/hooks'
import { selectUser } from '../store/authSlice'
import { isAppAdmin } from '../utils/permissions'
import type { Category } from '../types/category'

function buildTree(categories: Category[]): Array<{ category: Category; depth: number }> {
  const byParent = new Map<string | null, Category[]>()
  for (const c of categories) {
    const key = c.parentId
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key)!.push(c)
  }

  const result: Array<{ category: Category; depth: number }> = []
  function walk(parentId: string | null, depth: number) {
    for (const child of byParent.get(parentId) ?? []) {
      result.push({ category: child, depth })
      walk(child._id, depth + 1)
    }
  }
  walk(null, 0)

  // Orphans (parent missing/deleted) still need to show up somewhere.
  const seen = new Set(result.map((r) => r.category._id))
  for (const c of categories) {
    if (!seen.has(c._id)) result.push({ category: c, depth: 0 })
  }
  return result
}

export default function Categories() {
  const { app } = useOutletContext<AdminOutletContext>()
  const user = useAppSelector(selectUser)
  const canManage = !!app && isAppAdmin(user, app._id)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [deleteCategory, setDeleteCategoryState] = useState<Category | null>(null)

  const fetchCategories = useCallback(async () => {
    if (!app) return
    setLoading(true)
    try {
      const data = await api.get<Category[]>(`/categories?application=${app._id}`)
      setCategories(data)
    } finally {
      setLoading(false)
    }
  }, [app])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  const tree = buildTree(categories)

  return (
    <div className="mx-10 my-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: theme.textPrimary }}>
            Categories
          </h1>
          <p className="mt-1 text-[15px]" style={{ color: theme.textSecondary }}>
            {loading || !app
              ? '…'
              : `${categories.length} categor${categories.length !== 1 ? 'ies' : 'y'} in ${app.name}`}
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
            Create Category
          </button>
        )}
      </div>

      {loading ? (
        <SkeletonTable />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={<GridIcon size={28} />}
          title="No categories yet"
          description="Organize content by creating categories for this application."
          actionLabel={canManage ? 'Create Category' : undefined}
          onAction={canManage ? () => setShowCreate(true) : undefined}
        />
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                <th className="text-left font-semibold px-5 py-3" style={{ color: theme.textTertiary }}>Title</th>
                <th className="text-left font-semibold px-5 py-3" style={{ color: theme.textTertiary }}>Status</th>
                <th className="text-left font-semibold px-5 py-3" style={{ color: theme.textTertiary }}>Created</th>
                {canManage && (
                  <th className="text-right font-semibold px-5 py-3" style={{ color: theme.textTertiary }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {tree.map(({ category, depth }) => (
                <tr
                  key={category._id}
                  style={{ borderBottom: `1px solid ${theme.border}` }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = theme.rowHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center" style={{ paddingLeft: depth * 24 }}>
                      {depth > 0 && (
                        <span className="mr-2 text-sm" style={{ color: theme.textTertiary }}>└</span>
                      )}
                      <span className="font-medium" style={{ color: theme.textPrimary }}>
                        {category.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="text-[11px] font-semibold px-2 py-1 rounded-full"
                      style={category.status === 'active'
                        ? { background: theme.successBg, color: theme.success }
                        : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }
                      }
                    >
                      {category.status}
                    </span>
                  </td>
                  <td className="px-5 py-3" style={{ color: theme.textTertiary }}>
                    {new Date(category.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  {canManage && (
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditCategory(category)}
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
                          onClick={() => setDeleteCategoryState(category)}
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

      {(showCreate || editCategory) && app && (
        <CategoryModal
          applicationId={app._id}
          categories={categories}
          category={editCategory}
          onClose={() => { setShowCreate(false); setEditCategory(null) }}
          onSaved={fetchCategories}
        />
      )}
      {deleteCategory && (
        <ConfirmModal
          title={`Delete "${deleteCategory.title}"?`}
          message="This will remove the category. This action cannot be undone."
          confirmLabel="Delete Category"
          loadingLabel="Deleting…"
          onConfirm={() => api.delete(`/categories/${deleteCategory._id}`).then(fetchCategories)}
          onClose={() => setDeleteCategoryState(null)}
        />
      )}
    </div>
  )
}

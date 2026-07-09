import { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../api/client'
import type { AdminOutletContext } from '../components/AdminLayout'
import { theme } from '../theme'
import { EditIcon, TrashIcon, GridIcon } from '../components/icons'
import CategoryModal from '../components/CategoryModal'
import EmptyState from '../components/ui/EmptyState'
import SkeletonTable from '../components/ui/SkeletonTable'
import ConfirmModal from '../components/ui/ConfirmModal'
import IdCell from '../components/ui/IdCell'
import SortableHeader, { type SortDirection } from '../components/ui/SortableHeader'
import AdminPageHeader from '../components/ui/AdminPageHeader'
import AdminTable, { AdminTableRow, AdminTableHeadCell } from '../components/ui/AdminTable'
import AdminTableActionButton from '../components/ui/AdminTableActionButton'
import StatusBadge from '../components/ui/StatusBadge'
import { TranslationBadges } from '../components/ui/LanguageBadges'
import CreatedAtCell from '../components/ui/CreatedAtCell'
import { useAppSelector } from '../store/hooks'
import { selectUser } from '../store/authSlice'
import { isAppAdmin } from '../utils/permissions'
import { getPreviewTitle } from '../utils/translations'
import { LANGUAGE_VALUES } from '../types/content'
import type { Category } from '../types/category'

type SortBy = 'title' | 'createdAt'

// Categories are hierarchical, so unlike the flat Tags/Pages/Contents lists,
// sorting here reorders siblings within each parent rather than the whole
// list — the tree shape itself always stays intact.
function buildTree(categories: Category[], sortBy: SortBy, sortOrder: SortDirection): Array<{ category: Category; depth: number }> {
  const direction = sortOrder === 'asc' ? 1 : -1
  const compare = (a: Category, b: Category) =>
    sortBy === 'title'
      ? getPreviewTitle(a.translations).localeCompare(getPreviewTitle(b.translations)) * direction
      : (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction

  const byParent = new Map<string | null, Category[]>()
  for (const c of categories) {
    const key = c.parentId
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key)!.push(c)
  }
  for (const siblings of byParent.values()) siblings.sort(compare)

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
  const orphans = categories.filter((c) => !seen.has(c._id)).sort(compare)
  for (const c of orphans) result.push({ category: c, depth: 0 })
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
  const [sortBy, setSortBy] = useState<SortBy>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortDirection>('desc')

  function toggleSort(column: SortBy) {
    if (sortBy === column) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(column)
      setSortOrder(column === 'title' ? 'asc' : 'desc')
    }
  }

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

  const tree = buildTree(categories, sortBy, sortOrder)

  return (
    <div className="mx-10 my-10">
      <AdminPageHeader
        title="Categories"
        subtitle={loading || !app ? '…' : `${categories.length} categor${categories.length !== 1 ? 'ies' : 'y'} in ${app.name}`}
        actionLabel={canManage ? 'Create Category' : undefined}
        onAction={canManage ? () => setShowCreate(true) : undefined}
        actionDisabled={!app}
      />

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
        <AdminTable>
          <thead>
            <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
              <SortableHeader label="Title" active={sortBy === 'title'} direction={sortOrder} onClick={() => toggleSort('title')} />
              <AdminTableHeadCell>Public ID</AdminTableHeadCell>
              <AdminTableHeadCell>Languages</AdminTableHeadCell>
              <AdminTableHeadCell>Status</AdminTableHeadCell>
              <SortableHeader label="Created" active={sortBy === 'createdAt'} direction={sortOrder} onClick={() => toggleSort('createdAt')} />
              {canManage && <AdminTableHeadCell align="right">Actions</AdminTableHeadCell>}
            </tr>
          </thead>
          <tbody>
            {tree.map(({ category, depth }) => (
              <AdminTableRow key={category._id}>
                <td className="px-5 py-3">
                  <div className="flex items-center" style={{ paddingLeft: depth * 24 }}>
                    {depth > 0 && (
                      <span className="mr-2 text-sm" style={{ color: theme.textTertiary }}>└</span>
                    )}
                    <span className="font-medium" style={{ color: theme.textPrimary }}>
                      {getPreviewTitle(category.translations)}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <IdCell id={category.publicId} />
                </td>
                <td className="px-5 py-3">
                  <TranslationBadges translations={category.translations} />
                </td>
                <td className="px-5 py-3">
                  <StatusBadge active={category.status === 'active'} />
                </td>
                <CreatedAtCell date={category.createdAt} />
                {canManage && (
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <AdminTableActionButton onClick={() => setEditCategory(category)} title="Edit" variant="accent">
                        <EditIcon />
                      </AdminTableActionButton>
                      <AdminTableActionButton onClick={() => setDeleteCategoryState(category)} title="Delete" variant="danger">
                        <TrashIcon />
                      </AdminTableActionButton>
                    </div>
                  </td>
                )}
              </AdminTableRow>
            ))}
          </tbody>
        </AdminTable>
      )}

      {(showCreate || editCategory) && app && (
        <CategoryModal
          applicationId={app._id}
          allowedLanguages={app.languages ?? LANGUAGE_VALUES}
          categories={categories}
          category={editCategory}
          onClose={() => { setShowCreate(false); setEditCategory(null) }}
          onSaved={fetchCategories}
        />
      )}
      {deleteCategory && (
        <ConfirmModal
          title={`Delete "${getPreviewTitle(deleteCategory.translations)}"?`}
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

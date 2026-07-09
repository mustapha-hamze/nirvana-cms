import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../api/client'
import type { AdminOutletContext } from '../components/AdminLayout'
import { EditIcon, TrashIcon, TagIcon } from '../components/icons'
import TagModal from '../components/TagModal'
import EmptyState from '../components/ui/EmptyState'
import SkeletonTable from '../components/ui/SkeletonTable'
import ConfirmModal from '../components/ui/ConfirmModal'
import Pagination from '../components/ui/Pagination'
import SortableHeader from '../components/ui/SortableHeader'
import AdminPageHeader from '../components/ui/AdminPageHeader'
import ListSearchInput from '../components/ui/ListSearchInput'
import AdminTable, { AdminTableRow, AdminTableHeadCell, EmptyResultsRow } from '../components/ui/AdminTable'
import AdminTableActionButton from '../components/ui/AdminTableActionButton'
import StatusBadge from '../components/ui/StatusBadge'
import { TranslationBadges } from '../components/ui/LanguageBadges'
import CreatedAtCell from '../components/ui/CreatedAtCell'
import { useAppSelector } from '../store/hooks'
import { selectUser } from '../store/authSlice'
import { isAppAdmin } from '../utils/permissions'
import { getPreviewTitle } from '../utils/translations'
import { usePaginatedApiList } from '../hooks/usePaginatedApiList'
import { LANGUAGE_VALUES } from '../types/content'
import type { Tag } from '../types/tag'

export default function Tags() {
  const { app } = useOutletContext<AdminOutletContext>()
  const user = useAppSelector(selectUser)
  const canManage = !!app && isAppAdmin(user, app._id)
  const [showCreate, setShowCreate] = useState(false)
  const [editTag, setEditTag] = useState<Tag | null>(null)
  const [deleteTag, setDeleteTagState] = useState<Tag | null>(null)
  const {
    searchInput, setSearchInput, search, sortBy, sortOrder, page, setPage, toggleSort,
    result, loading, refresh: fetchTags,
  } = usePaginatedApiList<Tag>({ endpoint: '/tags', applicationId: app?._id })

  const { items: tags, total, totalPages, limit } = result
  const hasAnyTag = total > 0 || search

  return (
    <div className="mx-10 my-10">
      <AdminPageHeader
        title="Tags"
        subtitle={loading || !app ? '…' : `${total} tag${total !== 1 ? 's' : ''} in ${app.name}`}
        actionLabel={canManage ? 'Create Tag' : undefined}
        onAction={canManage ? () => setShowCreate(true) : undefined}
        actionDisabled={!app}
      />

      {hasAnyTag && <ListSearchInput value={searchInput} onChange={setSearchInput} />}

      {loading ? (
        <SkeletonTable />
      ) : !hasAnyTag ? (
        <EmptyState
          icon={<TagIcon size={28} />}
          title="No tags yet"
          description="Label content by creating tags for this application."
          actionLabel={canManage ? 'Create Tag' : undefined}
          onAction={canManage ? () => setShowCreate(true) : undefined}
        />
      ) : tags.length === 0 ? (
        <EmptyResultsRow message={`No tags match "${search}".`} />
      ) : (
        <AdminTable
          footer={<Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />}
        >
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <SortableHeader label="Title" active={sortBy === 'title'} direction={sortOrder} onClick={() => toggleSort('title')} />
              <AdminTableHeadCell>Languages</AdminTableHeadCell>
              <AdminTableHeadCell>Status</AdminTableHeadCell>
              <SortableHeader label="Created" active={sortBy === 'createdAt'} direction={sortOrder} onClick={() => toggleSort('createdAt')} />
              {canManage && <AdminTableHeadCell align="right">Actions</AdminTableHeadCell>}
            </tr>
          </thead>
          <tbody>
            {tags.map((tag) => (
              <AdminTableRow key={tag._id}>
                <td className="px-5 py-3">
                  <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {getPreviewTitle(tag.translations)}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <TranslationBadges translations={tag.translations} />
                </td>
                <td className="px-5 py-3">
                  <StatusBadge active={tag.status === 'active'} />
                </td>
                <CreatedAtCell date={tag.createdAt} />
                {canManage && (
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <AdminTableActionButton onClick={() => setEditTag(tag)} title="Edit" variant="accent">
                        <EditIcon />
                      </AdminTableActionButton>
                      <AdminTableActionButton onClick={() => setDeleteTagState(tag)} title="Delete" variant="danger">
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

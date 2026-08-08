import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../api/client'
import type { AdminOutletContext } from '../components/AdminLayout'
import { EditIcon, TrashIcon, UsersIcon } from '../components/icons'
import AuthorModal from '../components/AuthorModal'
import EmptyState from '../components/ui/EmptyState'
import SkeletonTable from '../components/ui/SkeletonTable'
import ConfirmModal from '../components/ui/ConfirmModal'
import Pagination from '../components/ui/Pagination'
import SortableHeader from '../components/ui/SortableHeader'
import AdminPageHeader from '../components/ui/AdminPageHeader'
import ListSearchInput from '../components/ui/ListSearchInput'
import AdminTable, { AdminTableRow, AdminTableHeadCell, EmptyResultsRow } from '../components/ui/AdminTable'
import { TableHeader, TableBody } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import AdminTableActionButton from '../components/ui/AdminTableActionButton'
import StatusBadge from '../components/ui/StatusBadge'
import CreatedAtCell from '../components/ui/CreatedAtCell'
import { useAppSelector } from '../store/hooks'
import { selectUser } from '../store/authSlice'
import { isAppAdmin } from '../utils/permissions'
import { resolveMediaUrl } from '../utils/mediaUrl'
import { usePaginatedApiList } from '../hooks/usePaginatedApiList'
import type { Author } from '../types/author'
import { LANGUAGE_VALUES } from '../types/content'
import { useLocale } from '../i18n/useLocale'

export default function Authors() {
  const { app } = useOutletContext<AdminOutletContext>()
  const { t } = useLocale()
  const user = useAppSelector(selectUser)
  const canManage = !!app && isAppAdmin(user, app._id)
  const [showCreate, setShowCreate] = useState(false)
  const [editAuthor, setEditAuthor] = useState<Author | null>(null)
  const [deleteAuthor, setDeleteAuthorState] = useState<Author | null>(null)
  const {
    searchInput, setSearchInput, search, sortBy, sortOrder, page, setPage, toggleSort,
    result, loading, refresh: fetchAuthors,
  } = usePaginatedApiList<Author>({ endpoint: '/authors', applicationId: app?._id })

  const { items: authors, total, totalPages, limit } = result
  const hasAnyAuthor = total > 0 || search

  return (
    <div className="mx-10 my-10">
      <AdminPageHeader
        title={t('authors.title')}
        subtitle={loading || !app ? '…' : t(total === 1 ? 'authors.subtitleOne' : 'authors.subtitleOther', { count: total, app: app.name })}
        actionLabel={canManage ? t('authors.createAuthor') : undefined}
        onAction={canManage ? () => setShowCreate(true) : undefined}
        actionDisabled={!app}
      />

      {hasAnyAuthor && <ListSearchInput value={searchInput} onChange={setSearchInput} />}

      {loading ? (
        <SkeletonTable />
      ) : !hasAnyAuthor ? (
        <EmptyState
          icon={<UsersIcon size={28} />}
          title={t('authors.noAuthorsTitle')}
          description={t('authors.noAuthorsDescription')}
          actionLabel={canManage ? t('authors.createAuthor') : undefined}
          onAction={canManage ? () => setShowCreate(true) : undefined}
        />
      ) : authors.length === 0 ? (
        <EmptyResultsRow message={t('authors.noAuthorsMatch', { search })} />
      ) : (
        <AdminTable
          footer={<Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />}
        >
          <TableHeader>
            <tr>
              <SortableHeader label={t('table.title')} active={sortBy === 'title'} direction={sortOrder} onClick={() => toggleSort('title')} />
              <AdminTableHeadCell>{t('authors.jobTitle')}</AdminTableHeadCell>
              <AdminTableHeadCell>{t('common.status')}</AdminTableHeadCell>
              <SortableHeader label={t('table.created')} active={sortBy === 'createdAt'} direction={sortOrder} onClick={() => toggleSort('createdAt')} />
              {canManage && <AdminTableHeadCell align="end">{t('common.actions')}</AdminTableHeadCell>}
            </tr>
          </TableHeader>
          <TableBody>
            {authors.map((author) => (
              <AdminTableRow key={author._id}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-7 w-7">
                      {author.avatar && <AvatarImage src={resolveMediaUrl('images', 'author', author.avatar)} alt="" />}
                      <AvatarFallback className="text-[11px]">{author.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {author.displayName}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="text-(--color-text-tertiary)">{author.jobTitle || '—'}</span>
                </td>
                <td className="px-5 py-3">
                  <StatusBadge active={author.status === 'active'} />
                </td>
                <CreatedAtCell date={author.createdAt} />
                {canManage && (
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <AdminTableActionButton onClick={() => setEditAuthor(author)} title={t('common.edit')} variant="accent">
                        <EditIcon />
                      </AdminTableActionButton>
                      <AdminTableActionButton onClick={() => setDeleteAuthorState(author)} title={t('common.delete')} variant="danger">
                        <TrashIcon />
                      </AdminTableActionButton>
                    </div>
                  </td>
                )}
              </AdminTableRow>
            ))}
          </TableBody>
        </AdminTable>
      )}

      {(showCreate || editAuthor) && app && (
        <AuthorModal
          applicationId={app._id}
          allowedLanguages={app.languages ?? LANGUAGE_VALUES}
          author={editAuthor}
          onClose={() => { setShowCreate(false); setEditAuthor(null) }}
          onSaved={fetchAuthors}
        />
      )}
      {deleteAuthor && (
        <ConfirmModal
          title={t('authors.deleteConfirmTitle', { name: deleteAuthor.displayName })}
          message={t('authors.deleteConfirmMessage')}
          confirmLabel={t('authors.deleteConfirmLabel')}
          loadingLabel={t('common.deleting')}
          onConfirm={() => api.delete(`/authors/${deleteAuthor._id}`).then(fetchAuthors)}
          onClose={() => setDeleteAuthorState(null)}
        />
      )}
    </div>
  )
}

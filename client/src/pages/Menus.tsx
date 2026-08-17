import { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { api } from '../api/client'
import type { AdminOutletContext } from '../components/AdminLayout'
import { EditIcon, TrashIcon, GridIcon, CopyIcon, QrCodeIcon, CheckCircleIcon } from '../components/icons'
import MenuModal from '../components/MenuModal'
import MenuQrDialog from '../components/MenuQrDialog'
import EmptyState from '../components/ui/EmptyState'
import SkeletonTable from '../components/ui/SkeletonTable'
import ConfirmModal from '../components/ui/ConfirmModal'
import IdCell from '../components/ui/IdCell'
import AdminPageHeader from '../components/ui/AdminPageHeader'
import AdminTable, { AdminTableRow, AdminTableHeadCell } from '../components/ui/AdminTable'
import { TableHeader, TableBody } from '@/components/ui/table'
import AdminTableActionButton from '../components/ui/AdminTableActionButton'
import { Button } from '@/components/ui/button'
import StatusBadge from '../components/ui/StatusBadge'
import CreatedAtCell from '../components/ui/CreatedAtCell'
import { useAppSelector } from '../store/hooks'
import { selectUser } from '../store/authSlice'
import { isAppAdmin } from '../utils/permissions'
import type { Menu } from '../types/menu'
import { useLocale } from '../i18n/useLocale'

export default function Menus() {
  const { app } = useOutletContext<AdminOutletContext>()
  const { t } = useLocale()
  const user = useAppSelector(selectUser)
  const canManage = !!app && isAppAdmin(user, app._id)
  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editMenu, setEditMenu] = useState<Menu | null>(null)
  const [deleteMenu, setDeleteMenuState] = useState<Menu | null>(null)
  const [qrMenu, setQrMenu] = useState<Menu | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchMenus = useCallback(async () => {
    if (!app) return
    setLoading(true)
    try {
      const data = await api.get<{ items: Menu[] }>(`/menus?application=${app._id}&limit=100`)
      setMenus(data.items)
    } finally {
      setLoading(false)
    }
  }, [app])

  useEffect(() => { fetchMenus() }, [fetchMenus])

  async function handleCopyUrl(menu: Menu) {
    try {
      const { url } = await api.get<{ url: string }>(`/menus/${menu._id}/public-url`)
      await navigator.clipboard.writeText(url)
      setCopiedId(menu._id)
      toast.success(t('menus.urlCopied'))
      setTimeout(() => setCopiedId((id) => (id === menu._id ? null : id)), 1500)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('menus.urlCopyFailed'))
    }
  }

  return (
    <div className="mx-10 my-10">
      <AdminPageHeader
        title={t('menus.title')}
        subtitle={loading || !app ? '…' : t(menus.length === 1 ? 'menus.subtitleOne' : 'menus.subtitleOther', { count: menus.length, app: app.name })}
        actionLabel={canManage ? t('menus.createMenu') : undefined}
        onAction={canManage ? () => setShowCreate(true) : undefined}
        actionDisabled={!app}
      />

      {loading ? (
        <SkeletonTable />
      ) : menus.length === 0 ? (
        <EmptyState
          icon={<GridIcon size={28} />}
          title={t('menus.noMenusTitle')}
          description={t('menus.noMenusDescription')}
          actionLabel={canManage ? t('menus.createMenu') : undefined}
          onAction={canManage ? () => setShowCreate(true) : undefined}
        />
      ) : (
        <AdminTable>
          <TableHeader>
            <tr>
              <AdminTableHeadCell>{t('menus.slug')}</AdminTableHeadCell>
              <AdminTableHeadCell>{t('table.publicId')}</AdminTableHeadCell>
              <AdminTableHeadCell>{t('menus.currency')}</AdminTableHeadCell>
              <AdminTableHeadCell>{t('common.status')}</AdminTableHeadCell>
              <AdminTableHeadCell>{t('table.created')}</AdminTableHeadCell>
              <AdminTableHeadCell align="end">{t('common.actions')}</AdminTableHeadCell>
            </tr>
          </TableHeader>
          <TableBody>
            {menus.map((menu) => (
              <AdminTableRow key={menu._id}>
                <td className="px-5 py-3">
                  <Link to={`/applications/${app!._id}/menus/${menu._id}`} className="font-medium text-foreground hover:underline">
                    {menu.slug}
                  </Link>
                </td>
                <td className="px-5 py-3">
                  <IdCell id={menu.publicId} />
                </td>
                <td className="px-5 py-3 text-(--color-text-tertiary)">{menu.currency}</td>
                <td className="px-5 py-3">
                  <StatusBadge active={menu.status === 'active'} />
                </td>
                <CreatedAtCell date={menu.createdAt} />
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button asChild variant="outline" size="sm" className="h-7 px-2.5 text-xs">
                      <Link to={`/applications/${app!._id}/menus/${menu._id}`}>{t('menus.manage')}</Link>
                    </Button>
                    <AdminTableActionButton onClick={() => handleCopyUrl(menu)} title={t('menus.copyUrl')} variant="accent">
                      {copiedId === menu._id ? <CheckCircleIcon size={13} /> : <CopyIcon size={13} />}
                    </AdminTableActionButton>
                    <AdminTableActionButton onClick={() => setQrMenu(menu)} title={t('menus.qrCode')} variant="accent">
                      <QrCodeIcon size={14} />
                    </AdminTableActionButton>
                    {canManage && (
                      <>
                        <AdminTableActionButton onClick={() => setEditMenu(menu)} title={t('common.edit')} variant="accent">
                          <EditIcon />
                        </AdminTableActionButton>
                        <AdminTableActionButton onClick={() => setDeleteMenuState(menu)} title={t('common.delete')} variant="danger">
                          <TrashIcon />
                        </AdminTableActionButton>
                      </>
                    )}
                  </div>
                </td>
              </AdminTableRow>
            ))}
          </TableBody>
        </AdminTable>
      )}

      {(showCreate || editMenu) && app && (
        <MenuModal
          applicationId={app._id}
          menu={editMenu}
          onClose={() => { setShowCreate(false); setEditMenu(null) }}
          onSaved={fetchMenus}
        />
      )}
      {deleteMenu && (
        <ConfirmModal
          title={t('menus.deleteConfirmTitle', { slug: deleteMenu.slug })}
          message={t('menus.deleteConfirmMessage')}
          confirmLabel={t('menus.deleteConfirmLabel')}
          loadingLabel={t('common.deleting')}
          onConfirm={() => api.delete(`/menus/${deleteMenu._id}`).then(fetchMenus)}
          onClose={() => setDeleteMenuState(null)}
        />
      )}
      {qrMenu && <MenuQrDialog menu={qrMenu} onClose={() => setQrMenu(null)} />}
    </div>
  )
}

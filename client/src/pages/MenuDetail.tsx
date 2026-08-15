import { useState, useEffect, useCallback } from 'react'
import { useOutletContext, useParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { api } from '../api/client'
import type { AdminOutletContext } from '../components/AdminLayout'
import { BackIcon, EditIcon, TrashIcon, PlusIcon, GridIcon, CopyIcon, QrCodeIcon, CheckCircleIcon } from '../components/icons'
import MenuCategoryModal from '../components/MenuCategoryModal'
import MenuItemModal from '../components/MenuItemModal'
import MenuQrDialog from '../components/MenuQrDialog'
import EmptyState from '../components/ui/EmptyState'
import SkeletonTable from '../components/ui/SkeletonTable'
import ConfirmModal from '../components/ui/ConfirmModal'
import AdminTableActionButton from '../components/ui/AdminTableActionButton'
import StatusBadge from '../components/ui/StatusBadge'
import AvailabilityBadge from '../components/ui/AvailabilityBadge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAppSelector } from '../store/hooks'
import { selectUser } from '../store/authSlice'
import { isAppAdmin } from '../utils/permissions'
import { getPreviewTitle } from '../utils/translations'
import { LANGUAGE_VALUES } from '../types/content'
import type { Menu, MenuCategory, MenuItem } from '../types/menu'
import { useLocale } from '../i18n/useLocale'

export default function MenuDetail() {
  const { app } = useOutletContext<AdminOutletContext>()
  const { menuId } = useParams<{ menuId: string }>()
  const { t } = useLocale()
  const user = useAppSelector(selectUser)
  const canManageCategories = !!app && isAppAdmin(user, app._id)

  const [menu, setMenu] = useState<Menu | null>(null)
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [items, setItems] = useState<MenuItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)

  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [editCategory, setEditCategory] = useState<MenuCategory | null>(null)
  const [deleteCategory, setDeleteCategoryState] = useState<MenuCategory | null>(null)
  const [showCreateItem, setShowCreateItem] = useState(false)
  const [editItem, setEditItem] = useState<MenuItem | null>(null)
  const [deleteItem, setDeleteItemState] = useState<MenuItem | null>(null)
  const [showQr, setShowQr] = useState(false)
  const [urlCopied, setUrlCopied] = useState(false)

  const allowedLanguages = app?.languages ?? LANGUAGE_VALUES

  const fetchMenu = useCallback(async () => {
    if (!menuId) return
    setMenu(await api.get<Menu>(`/menus/${menuId}`))
  }, [menuId])

  const fetchCategories = useCallback(async () => {
    if (!app || !menuId) return
    setLoadingCategories(true)
    try {
      const data = await api.get<MenuCategory[]>(`/menu-categories?application=${app._id}&menu=${menuId}`)
      setCategories(data)
      setSelectedCategoryId((current) => current && data.some((c) => c._id === current) ? current : (data[0]?._id ?? null))
    } finally {
      setLoadingCategories(false)
    }
  }, [app, menuId])

  const fetchItems = useCallback(async () => {
    if (!app || !menuId || !selectedCategoryId) { setItems([]); return }
    setLoadingItems(true)
    try {
      const data = await api.get<MenuItem[]>(`/menu-items?application=${app._id}&menu=${menuId}&category=${selectedCategoryId}`)
      setItems(data)
    } finally {
      setLoadingItems(false)
    }
  }, [app, menuId, selectedCategoryId])

  useEffect(() => { fetchMenu() }, [fetchMenu])
  useEffect(() => { fetchCategories() }, [fetchCategories])
  useEffect(() => { fetchItems() }, [fetchItems])

  async function handleCopyUrl() {
    if (!menu) return
    try {
      const { url } = await api.get<{ url: string }>(`/menus/${menu._id}/public-url`)
      await navigator.clipboard.writeText(url)
      setUrlCopied(true)
      toast.success(t('menus.urlCopied'))
      setTimeout(() => setUrlCopied(false), 1500)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('menus.urlCopyFailed'))
    }
  }

  const selectedCategory = categories.find((c) => c._id === selectedCategoryId) ?? null

  return (
    <div className="mx-10 my-10">
      <div className="flex items-center gap-3 mb-1">
        <Button asChild variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground">
          <Link to={app ? `/applications/${app._id}/menus` : '#'} title={t('common.back')}>
            <BackIcon size={16} />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {menu?.slug ?? '…'}
        </h1>
        {menu && <StatusBadge active={menu.status === 'active'} />}
      </div>
      <div className="flex items-center gap-2 mb-8 ms-11">
        <Button type="button" variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1.5" onClick={handleCopyUrl}>
          {urlCopied ? <CheckCircleIcon size={13} /> : <CopyIcon size={13} />}
          {t('menus.copyUrl')}
        </Button>
        <Button type="button" variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1.5" onClick={() => setShowQr(true)}>
          <QrCodeIcon size={13} />
          {t('menus.qrCode')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
        {/* Categories */}
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="text-sm font-semibold text-foreground">{t('menuCategories.title')}</span>
            {canManageCategories && (
              <Button type="button" size="icon-xs" variant="ghost" onClick={() => setShowCreateCategory(true)} title={t('menuCategories.createCategory')}>
                <PlusIcon size={14} />
              </Button>
            )}
          </div>
          {loadingCategories ? (
            <div className="p-3"><SkeletonTable rows={3} /></div>
          ) : categories.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              {t('menuCategories.noCategoriesDescription')}
            </div>
          ) : (
            <ul>
              {categories.map((category) => (
                <li key={category._id}>
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId(category._id)}
                    className={cn(
                      'w-full flex items-center justify-between gap-2 px-4 py-2.5 text-start text-sm border-b last:border-b-0',
                      selectedCategoryId === category._id ? 'bg-accent text-accent-foreground' : 'hover:bg-(--color-hover-bg-subtle)',
                    )}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="truncate">{getPreviewTitle(category.translations)}</span>
                      {category.status === 'inactive' && <StatusBadge active={false} />}
                    </span>
                    {canManageCategories && (
                      <span className="flex items-center gap-0.5 shrink-0">
                        <AdminTableActionButton onClick={() => setEditCategory(category)} title={t('common.edit')} variant="accent">
                          <EditIcon size={13} />
                        </AdminTableActionButton>
                        <AdminTableActionButton onClick={() => setDeleteCategoryState(category)} title={t('common.delete')} variant="danger">
                          <TrashIcon size={13} />
                        </AdminTableActionButton>
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Items */}
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="text-sm font-semibold text-foreground">
              {selectedCategory ? `${t('menuItems.title')} — ${getPreviewTitle(selectedCategory.translations)}` : t('menuItems.title')}
            </span>
            {selectedCategory && (
              <Button type="button" size="icon-xs" variant="ghost" onClick={() => setShowCreateItem(true)} title={t('menuItems.createItem')}>
                <PlusIcon size={14} />
              </Button>
            )}
          </div>
          {!selectedCategory ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              {categories.length === 0 ? t('menuCategories.noCategoriesDescription') : t('menuItems.selectCategoryHint')}
            </div>
          ) : loadingItems ? (
            <div className="p-3"><SkeletonTable rows={3} /></div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={<GridIcon size={28} />}
              title={t('menuItems.noItemsTitle')}
              description={t('menuItems.noItemsDescription')}
              actionLabel={t('menuItems.createItem')}
              onAction={() => setShowCreateItem(true)}
            />
          ) : (
            <ul>
              {items.map((item) => (
                <li key={item._id} className="flex items-center justify-between gap-3 px-4 py-3 border-b last:border-b-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground truncate">{getPreviewTitle(item.translations)}</span>
                      <AvailabilityBadge availability={item.availability} />
                      {item.status === 'inactive' && <StatusBadge active={false} />}
                    </div>
                    <span className="text-xs text-(--color-text-tertiary)">
                      {menu?.currency} {item.price}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <AdminTableActionButton onClick={() => setEditItem(item)} title={t('common.edit')} variant="accent">
                      <EditIcon size={14} />
                    </AdminTableActionButton>
                    {canManageCategories && (
                      <AdminTableActionButton onClick={() => setDeleteItemState(item)} title={t('common.delete')} variant="danger">
                        <TrashIcon size={14} />
                      </AdminTableActionButton>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {(showCreateCategory || editCategory) && app && menuId && (
        <MenuCategoryModal
          applicationId={app._id}
          menuId={menuId}
          allowedLanguages={allowedLanguages}
          category={editCategory}
          onClose={() => { setShowCreateCategory(false); setEditCategory(null) }}
          onSaved={fetchCategories}
        />
      )}
      {deleteCategory && (
        <ConfirmModal
          title={t('menuCategories.deleteConfirmTitle', { name: getPreviewTitle(deleteCategory.translations) })}
          message={t('menuCategories.deleteConfirmMessage')}
          confirmLabel={t('menuCategories.deleteConfirmLabel')}
          loadingLabel={t('common.deleting')}
          onConfirm={() => api.delete(`/menu-categories/${deleteCategory._id}`).then(fetchCategories)}
          onClose={() => setDeleteCategoryState(null)}
        />
      )}

      {(showCreateItem || editItem) && app && menuId && selectedCategoryId && (
        <MenuItemModal
          applicationId={app._id}
          menuId={menuId}
          categoryId={selectedCategoryId}
          allowedLanguages={allowedLanguages}
          item={editItem}
          canManageStatus={canManageCategories}
          onClose={() => { setShowCreateItem(false); setEditItem(null) }}
          onSaved={fetchItems}
        />
      )}
      {deleteItem && (
        <ConfirmModal
          title={t('menuItems.deleteConfirmTitle', { name: getPreviewTitle(deleteItem.translations) })}
          message={t('menuItems.deleteConfirmMessage')}
          confirmLabel={t('menuItems.deleteConfirmLabel')}
          loadingLabel={t('common.deleting')}
          onConfirm={() => api.delete(`/menu-items/${deleteItem._id}`).then(fetchItems)}
          onClose={() => setDeleteItemState(null)}
        />
      )}
      {showQr && menu && <MenuQrDialog menu={menu} onClose={() => setShowQr(false)} />}
    </div>
  )
}

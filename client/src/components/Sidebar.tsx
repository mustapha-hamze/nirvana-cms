import { useEffect, useState, type ReactNode } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useAppSelector } from '../store/hooks'
import { selectUser, selectUserRole } from '../store/authSlice'
import { isAppAdmin } from '../utils/permissions'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useLocale } from '../i18n/useLocale'
import type { TranslationKey } from '../i18n/types'
import { DashboardIcon, ContentIcon, ChevronIcon, UsersIcon, GridIcon, CloseIcon } from './icons'

const ALL_CONTENT_MANAGEMENT_ITEMS: { labelKey: TranslationKey; segment: string; adminOnly?: boolean }[] = [
  { labelKey: 'nav.contents', segment: 'contents' },
  { labelKey: 'nav.pages', segment: 'pages' },
  { labelKey: 'nav.categories', segment: 'categories', adminOnly: true },
  { labelKey: 'nav.tags', segment: 'tags', adminOnly: true },
  { labelKey: 'nav.authors', segment: 'authors', adminOnly: true },
]

const navItemClass = (active: boolean) =>
  cn(
    'w-full justify-start gap-3 px-3 py-2.5 h-auto rounded-xl text-sm font-medium',
    active
      ? 'bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground'
      : 'text-muted-foreground hover:bg-(--color-hover-bg-subtle) hover:text-muted-foreground',
  )

// The nav itself — shared by the desktop <aside> (Sidebar, always mounted at
// md+) and the mobile slide-over drawer (MobileSidebarDrawer, hidden at md+).
// Keeping one copy of the links means the two surfaces can't drift apart.
function SidebarNav({ appId, onNavigate }: { appId: string; onNavigate?: () => void }) {
  const role = useAppSelector(selectUserRole)
  const user = useAppSelector(selectUser)
  const isAppAdminUser = isAppAdmin(user, appId)
  const location = useLocation()
  const { t } = useLocale()

  const CONTENT_MANAGEMENT_ITEMS = ALL_CONTENT_MANAGEMENT_ITEMS.filter(
    (item) => !item.adminOnly || isAppAdminUser,
  )

  const contentPaths = CONTENT_MANAGEMENT_ITEMS.map((item) => `/applications/${appId}/${item.segment}`)
  const isContentSectionActive = contentPaths.includes(location.pathname)
  const [contentOpen, setContentOpen] = useState(isContentSectionActive)

  useEffect(() => {
    if (isContentSectionActive) setContentOpen(true)
  }, [isContentSectionActive])

  return (
    <>
      <nav className="space-y-1">
        <SidebarLink to={`/applications/${appId}/dashboard`} icon={<DashboardIcon />} onNavigate={onNavigate}>
          {t('nav.dashboard')}
        </SidebarLink>

        <div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setContentOpen((v) => !v)}
            className={cn(navItemClass(isContentSectionActive), 'justify-between')}
          >
            <span className="flex items-center gap-3">
              <ContentIcon />
              {t('nav.contentManagement')}
            </span>
            <ChevronIcon open={contentOpen} />
          </Button>

          {contentOpen && (
            <div className="mt-1 ms-4.5 ps-3 space-y-1 border-s">
              {CONTENT_MANAGEMENT_ITEMS.map((item) => (
                <SidebarLink key={item.segment} to={`/applications/${appId}/${item.segment}`} onNavigate={onNavigate}>
                  {t(item.labelKey)}
                </SidebarLink>
              ))}
            </div>
          )}
        </div>
      </nav>

      {role === 'SuperAdmin' && (
        <div className="mt-6">
          <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-(--color-text-tertiary)">
            {t('nav.admin')}
          </p>
          <nav className="space-y-1">
            <SidebarLink to={`/applications/${appId}/users`} icon={<UsersIcon />} onNavigate={onNavigate}>
              {t('nav.users')}
            </SidebarLink>
            <SidebarLink to="/applications" icon={<GridIcon />} onNavigate={onNavigate}>
              {t('nav.applications')}
            </SidebarLink>
          </nav>
        </div>
      )}
    </>
  )
}

export default function Sidebar({ appId }: { appId: string }) {
  return (
    <aside className="w-68 shrink-0 border-e bg-(--color-sidebar-bg) px-3 py-6 hidden md:block">
      <SidebarNav appId={appId} />
    </aside>
  )
}

// Slide-over nav for <md viewports, where the desktop <aside> above is
// hidden entirely — without this, Contents/Pages/Categories/Tags/Users are
// unreachable on phones and small tablets (only whatever route you're
// already on works, via direct URL).
export function MobileSidebarDrawer({ appId, open, onClose }: { appId: string; open: boolean; onClose: () => void }) {
  const { t } = useLocale()
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside className="absolute inset-y-0 start-0 w-72 max-w-[85vw] overflow-y-auto border-e bg-(--color-sidebar-bg) px-3 py-6">
        <div className="flex items-center justify-end px-1 mb-4">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            title={t('nav.closeMenu')}
            className="text-muted-foreground hover:text-foreground"
          >
            <CloseIcon size={20} />
          </Button>
        </div>
        <SidebarNav appId={appId} onNavigate={onClose} />
      </aside>
    </div>
  )
}

function SidebarLink({
  to, icon, children, onNavigate,
}: { to: string; icon?: ReactNode; children: ReactNode; onNavigate?: () => void }) {
  const location = useLocation()
  const active = location.pathname === to

  return (
    <Button type="button" variant="ghost" asChild className={navItemClass(active)}>
      <Link to={to} onClick={onNavigate}>
        {icon}
        {children}
      </Link>
    </Button>
  )
}

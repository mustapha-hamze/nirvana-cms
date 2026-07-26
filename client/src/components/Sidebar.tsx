import { useEffect, useState, type ReactNode } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useAppSelector } from '../store/hooks'
import { selectUser, selectUserRole } from '../store/authSlice'
import { isAppAdmin } from '../utils/permissions'
import { theme } from '../theme'
import { DashboardIcon, ContentIcon, ChevronIcon, UsersIcon, GridIcon, CloseIcon } from './icons'

const ALL_CONTENT_MANAGEMENT_ITEMS = [
  { label: 'Contents', segment: 'contents' },
  { label: 'Pages', segment: 'pages' },
  { label: 'Categories', segment: 'categories', adminOnly: true },
  { label: 'Tags', segment: 'tags', adminOnly: true },
]

// The nav itself — shared by the desktop <aside> (Sidebar, always mounted at
// md+) and the mobile slide-over drawer (MobileSidebarDrawer, hidden at md+).
// Keeping one copy of the links means the two surfaces can't drift apart.
function SidebarNav({ appId, onNavigate }: { appId: string; onNavigate?: () => void }) {
  const role = useAppSelector(selectUserRole)
  const user = useAppSelector(selectUser)
  const isAppAdminUser = isAppAdmin(user, appId)
  const location = useLocation()

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
          Dashboard
        </SidebarLink>

        <div>
          <button
            type="button"
            onClick={() => setContentOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={isContentSectionActive
              ? { background: theme.accentBg, color: theme.accentHover }
              : { color: theme.textSecondary }
            }
            onMouseEnter={(e) => {
              if (!isContentSectionActive) e.currentTarget.style.background = theme.hoverBgSubtle
            }}
            onMouseLeave={(e) => {
              if (!isContentSectionActive) e.currentTarget.style.background = 'transparent'
            }}
          >
            <span className="flex items-center gap-3">
              <ContentIcon />
              Content Management
            </span>
            <ChevronIcon open={contentOpen} />
          </button>

          {contentOpen && (
            <div className="mt-1 ml-4.5 pl-3 space-y-1" style={{ borderLeft: `1px solid ${theme.border}` }}>
              {CONTENT_MANAGEMENT_ITEMS.map((item) => (
                <SidebarLink key={item.segment} to={`/applications/${appId}/${item.segment}`} onNavigate={onNavigate}>
                  {item.label}
                </SidebarLink>
              ))}
            </div>
          )}
        </div>
      </nav>

      {role === 'SuperAdmin' && (
        <div className="mt-6">
          <p
            className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: theme.textTertiary }}
          >
            Admin
          </p>
          <nav className="space-y-1">
            <SidebarLink to={`/applications/${appId}/users`} icon={<UsersIcon />} onNavigate={onNavigate}>
              Users
            </SidebarLink>
            <SidebarLink to="/applications" icon={<GridIcon />} onNavigate={onNavigate}>
              Applications
            </SidebarLink>
          </nav>
        </div>
      )}
    </>
  )
}

export default function Sidebar({ appId }: { appId: string }) {
  return (
    <aside
      className="w-68 shrink-0 px-3 py-6 hidden md:block"
      style={{ background: theme.sidebarBg, borderRight: `1px solid ${theme.border}` }}
    >
      <SidebarNav appId={appId} />
    </aside>
  )
}

// Slide-over nav for <md viewports, where the desktop <aside> above is
// hidden entirely — without this, Contents/Pages/Categories/Tags/Users are
// unreachable on phones and small tablets (only whatever route you're
// already on works, via direct URL).
export function MobileSidebarDrawer({ appId, open, onClose }: { appId: string; open: boolean; onClose: () => void }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside
        className="absolute inset-y-0 left-0 w-72 max-w-[85vw] px-3 py-6 overflow-y-auto"
        style={{ background: theme.sidebarBg, borderRight: `1px solid ${theme.border}` }}
      >
        <div className="flex items-center justify-end px-1 mb-4">
          <button
            type="button"
            onClick={onClose}
            title="Close menu"
            className="p-1.5 rounded-lg transition"
            style={{ color: theme.textMuted }}
          >
            <CloseIcon size={20} />
          </button>
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
    <Link
      to={to}
      onClick={onNavigate}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
      style={active
        ? { background: theme.accentBg, color: theme.accentHover }
        : { color: theme.textSecondary }
      }
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = theme.hoverBgSubtle
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'transparent'
      }}
    >
      {icon}
      {children}
    </Link>
  )
}

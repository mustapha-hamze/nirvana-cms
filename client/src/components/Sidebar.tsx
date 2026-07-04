import { useEffect, useState, type ReactNode } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useAppSelector } from '../store/hooks'
import { selectUserRole } from '../store/authSlice'
import { theme } from '../theme'
import { DashboardIcon, ContentIcon, ChevronIcon, UsersIcon, GridIcon } from './icons'

const CONTENT_MANAGEMENT_ITEMS = [
  { label: 'Contents', segment: 'contents' },
  { label: 'Pages', segment: 'pages' },
  { label: 'Categories', segment: 'categories' },
  { label: 'Tags', segment: 'tags' },
]

export default function Sidebar({ appId }: { appId: string }) {
  const role = useAppSelector(selectUserRole)
  const location = useLocation()

  const contentPaths = CONTENT_MANAGEMENT_ITEMS.map((item) => `/applications/${appId}/${item.segment}`)
  const isContentSectionActive = contentPaths.includes(location.pathname)
  const [contentOpen, setContentOpen] = useState(isContentSectionActive)

  useEffect(() => {
    if (isContentSectionActive) setContentOpen(true)
  }, [isContentSectionActive])

  return (
    <aside
      className="w-68 shrink-0 px-3 py-6 hidden md:block"
      style={{ background: theme.sidebarBg, borderRight: `1px solid ${theme.border}` }}
    >
      <nav className="space-y-1">
        <SidebarLink to={`/applications/${appId}/dashboard`} icon={<DashboardIcon />}>
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
              if (!isContentSectionActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
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
                <SidebarLink key={item.segment} to={`/applications/${appId}/${item.segment}`}>
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
            <SidebarLink to={`/applications/${appId}/users`} icon={<UsersIcon />}>
              Users
            </SidebarLink>
            <SidebarLink to="/applications" icon={<GridIcon />}>
              Applications
            </SidebarLink>
          </nav>
        </div>
      )}
    </aside>
  )
}

function SidebarLink({ to, icon, children }: { to: string; icon?: ReactNode; children: ReactNode }) {
  const location = useLocation()
  const active = location.pathname === to

  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
      style={active
        ? { background: theme.accentBg, color: theme.accentHover }
        : { color: theme.textSecondary }
      }
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
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

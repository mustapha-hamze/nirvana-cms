import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation, Outlet } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { logout, selectUser } from '../store/authSlice'
import { api } from '../api/client'
import { theme } from '../theme'
import { BackIcon, LogoutIcon, MenuIcon } from './icons'
import Sidebar, { MobileSidebarDrawer } from './Sidebar'
import ThemeToggle from './ui/ThemeToggle'
import type { Application } from '../types/application'

export type AdminOutletContext = { app: Application | null }

export default function AdminLayout() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectUser)
  const [app, setApp] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => { setMobileNavOpen(false) }, [location.pathname])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api.get<Application>(`/applications/${id}`)
      .then(setApp)
      .finally(() => setLoading(false))
  }, [id])

  function handleLogout() {
    dispatch(logout())
    navigate('/login', { replace: true })
  }

  const initials = user?.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen flex flex-col" style={{ background: theme.bg }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40"
        style={{ background: theme.headerBg, borderBottom: `1px solid ${theme.border}` }}
      >
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => setMobileNavOpen(true)}
              title="Open menu"
              className="p-2 -ml-2 rounded-lg transition shrink-0 md:hidden"
              style={{ color: theme.textMuted }}
            >
              <MenuIcon />
            </button>

            {user?.role === 'SuperAdmin' && (
              <>
                <button
                  onClick={() => navigate('/applications')}
                  title="Back to Applications"
                  className="p-2 rounded-lg transition shrink-0"
                  style={{ color: theme.textMuted }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = theme.textPrimary
                    e.currentTarget.style.background = theme.hoverBgSubtle
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = theme.textMuted
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <BackIcon />
                </button>

                <div className="w-px h-6 shrink-0" style={{ background: theme.border }} />
              </>
            )}

            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center overflow-hidden"
                style={app?.logo
                  ? { border: `1px solid ${theme.border}` }
                  : { background: theme.accentGradientDiag }
                }
              >
                {app?.logo
                  ? <img src={app.logo} alt={app.name} className="w-full h-full object-cover" />
                  : <span className="text-white text-xs font-bold">{app?.name?.[0]?.toUpperCase() ?? ''}</span>
                }
              </div>
              <span className="font-semibold text-[15px] truncate" style={{ color: theme.textPrimary }}>
                {loading ? 'Loading…' : app?.name ?? 'Application'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                style={{ background: theme.accentGradientDiag }}
              >
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium leading-none" style={{ color: theme.textStrong }}>
                  {user?.name}
                </p>
                <p className="text-xs mt-0.5" style={{ color: theme.textFaint }}>
                  {user?.role}
                </p>
              </div>
            </div>

            <div className="w-px h-5" style={{ background: theme.divider }} />

            <ThemeToggle />

            <div className="w-px h-5" style={{ background: theme.divider }} />

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm transition"
              style={{ color: theme.textMuted }}
              onMouseEnter={(e) => (e.currentTarget.style.color = theme.danger)}
              onMouseLeave={(e) => (e.currentTarget.style.color = theme.textMuted)}
            >
              <LogoutIcon />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <Sidebar appId={id ?? ''} />
        <MobileSidebarDrawer appId={id ?? ''} open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
        <main className="flex-1 min-w-0">
          <Outlet context={{ app } satisfies AdminOutletContext} />
        </main>
      </div>
    </div>
  )
}

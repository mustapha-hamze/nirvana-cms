import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation, Outlet } from 'react-router-dom'
import { useAppSelector } from '../store/hooks'
import { selectUser } from '../store/authSlice'
import { api, logoutRequest } from '../api/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { BackIcon, LogoutIcon, MenuIcon } from './icons'
import Sidebar, { MobileSidebarDrawer } from './Sidebar'
import ThemeToggle from './ui/ThemeToggle'
import LocaleToggle from './ui/LocaleToggle'
import { useLocale } from '../i18n/useLocale'
import type { Application } from '../types/application'

export type AdminOutletContext = { app: Application | null }

export default function AdminLayout() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAppSelector(selectUser)
  const { t } = useLocale()
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

  async function handleLogout() {
    await logoutRequest()
    navigate('/login', { replace: true })
  }

  const initials = user?.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-(--color-header-bg)">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setMobileNavOpen(true)}
              title={t('nav.openMenu')}
              className="-ms-2 shrink-0 text-muted-foreground hover:text-foreground md:hidden"
            >
              <MenuIcon />
            </Button>

            {user?.role === 'SuperAdmin' && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => navigate('/applications')}
                  title={t('nav.backToApplications')}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <BackIcon />
                </Button>

                <Separator orientation="vertical" className="h-6 shrink-0" />
              </>
            )}

            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center overflow-hidden ${app?.logo ? 'border' : ''}`}
                style={app?.logo ? undefined : { background: 'var(--color-accent-gradient-diag)' }}
              >
                {app?.logo
                  ? <img src={app.logo} alt={app.name} className="w-full h-full object-cover" />
                  : <span className="text-white text-xs font-bold">{app?.name?.[0]?.toUpperCase() ?? ''}</span>
                }
              </div>
              <span className="font-semibold text-[15px] truncate text-foreground">
                {loading ? t('common.loading') : app?.name ?? t('common.application')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2.5">
              <Avatar>
                <AvatarFallback className="bg-[image:var(--color-accent-gradient-diag)] text-white">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-medium leading-none text-(--color-text-strong)">
                  {user?.name}
                </p>
                <p className="text-xs mt-0.5 text-(--color-text-faint)">
                  {user?.role}
                </p>
              </div>
            </div>

            <Separator orientation="vertical" className="h-5" />

            <LocaleToggle />

            <Separator orientation="vertical" className="h-5" />

            <ThemeToggle />

            <Separator orientation="vertical" className="h-5" />

            <Button
              type="button"
              variant="ghost"
              onClick={handleLogout}
              className="h-auto gap-1.5 p-0 text-sm text-(--color-text-muted) hover:bg-transparent hover:text-destructive"
            >
              <LogoutIcon />
              <span className="hidden sm:inline">{t('nav.logout')}</span>
            </Button>
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

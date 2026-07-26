import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { logout, selectUser } from '../store/authSlice'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { LogoutIcon } from './icons'
import ThemeToggle from './ui/ThemeToggle'

export default function Layout({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectUser)
  const navigate = useNavigate()

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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b bg-(--color-header-bg)">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center border bg-primary/50">
              <NLogo />
            </div>
            <span className="font-semibold text-[15px] tracking-wide text-(--color-text-strong)">
              Nirvana CMS
            </span>
          </div>

          <div className="flex items-center gap-4">
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

            <ThemeToggle />

            <Separator orientation="vertical" className="h-5" />

            <Button
              type="button"
              variant="ghost"
              onClick={handleLogout}
              className="h-auto gap-1.5 p-0 text-sm text-(--color-text-muted) hover:bg-transparent hover:text-destructive"
            >
              <LogoutIcon />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  )
}

function NLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M3 16 L3 4 L8.5 4 L14 12 L14 4 L17 4 L17 16 L11.5 16 L6 8 L6 16 Z" fill="white" fillOpacity="0.9" />
    </svg>
  )
}

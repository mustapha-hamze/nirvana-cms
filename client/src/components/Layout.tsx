import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { logout, selectUser } from '../store/authSlice'
import { theme } from '../theme'
import { LogoutIcon } from './icons'

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
    <div className="min-h-screen flex flex-col" style={{ background: theme.bg }}>
      {/* Nav */}
      <header
        className="sticky top-0 z-40"
        style={{ background: theme.headerBg, borderBottom: `1px solid ${theme.border}` }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(124,58,237,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <NLogo />
            </div>
            <span className="font-semibold text-[15px] tracking-wide" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Nirvana CMS
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                style={{ background: theme.accentGradientDiag }}
              >
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium leading-none" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {user?.name}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {user?.role}
                </p>
              </div>
            </div>

            <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.08)' }} />

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm transition"
              style={{ color: 'rgba(255,255,255,0.4)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = theme.danger)}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
            >
              <LogoutIcon />
              <span className="hidden sm:inline">Logout</span>
            </button>
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

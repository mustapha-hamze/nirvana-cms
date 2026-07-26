import { useId, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAppDispatch } from '../store/hooks'
import { loginSuccess, type AuthUser } from '../store/authSlice'

export default function Login() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const emailId = useId()
  const passwordId = useId()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.post<{ token: string; user: AuthUser }>('/auth/login', { email, password })
      const { user } = data

      if (user.role !== 'SuperAdmin' && user.applications.length === 0) {
        setError('Your account is not assigned to any application yet.')
        return
      }
      // WebsiteUser has no screens in this admin panel today — every /applications/:id
      // route excludes it (see ProtectedRoute in App.tsx). Without this check the user
      // would authenticate successfully and then get silently bounced back to /login,
      // which reads as a broken login rather than a permissions gap.
      if (user.role === 'WebsiteUser') {
        setError("Your account doesn't have access to the admin panel.")
        return
      }

      dispatch(loginSuccess({ token: data.token, user }))
      navigate(
        user.role === 'SuperAdmin' ? '/applications' : `/applications/${user.applications[0]._id}/dashboard`,
        { replace: true },
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen font-sans">

      {/* ── Left: brand panel ─────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[58%] relative overflow-hidden flex-col justify-between p-16"
        style={{ background: 'linear-gradient(135deg, #1e0a3c 0%, #2d1065 30%, #1a1040 60%, #0d0d1a 100%)' }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 w-125 h-125 rounded-full opacity-25"
            style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)' }} />
          <div className="absolute bottom-0 right-0 w-100 h-100 rounded-full opacity-20 translate-x-1/4 translate-y-1/4"
            style={{ background: 'radial-gradient(circle, #4f46e5, transparent 70%)' }} />
          <div className="absolute top-1/2 left-1/2 w-75 h-75 rounded-full opacity-15 -translate-x-1/2 -translate-y-1/2"
            style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }} />
        </div>
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center border border-white/10"
            style={{ background: 'rgba(124, 58, 237, 0.4)', backdropFilter: 'blur(8px)' }}>
            <NLogo />
          </div>
          <span className="text-white/80 font-semibold text-lg tracking-wide">Nirvana CMS</span>
        </div>

        <div className="relative z-10 space-y-1">
          <p className="text-white/40 text-xs font-semibold tracking-[0.25em] uppercase mb-8">
            The platform for forward-thinking businesses
          </p>
          <h1 className="text-[3.25rem] font-bold leading-[1.15] tracking-tight text-white">
            Content<br />without chaos.
          </h1>
          <h2 className="text-[3.25rem] font-bold leading-[1.15] tracking-tight"
            style={{ background: 'linear-gradient(90deg, #c4b5fd, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Business<br />without boundaries.
          </h2>
          <p className="text-2xl font-light pt-5" style={{ color: 'rgba(196, 181, 253, 0.6)' }}>
            Welcome to{' '}
            <span className="font-semibold" style={{ color: 'rgba(196, 181, 253, 0.9)' }}>Nirvana.</span>
          </p>
        </div>

        <p className="relative z-10 text-white/20 text-xs">
          © {new Date().getFullYear()} Nirvana CMS. All rights reserved.
        </p>
      </div>

      {/* ── Right: login form ──────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-8 py-16 bg-slate-50">
        <div className="w-full max-w-100">

          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
              <NLogo />
            </div>
            <span className="text-slate-800 font-semibold text-lg">Nirvana CMS</span>
          </div>

          <div className="mb-9">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-slate-500 mt-2 text-[15px]">Sign in to manage your applications</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor={emailId} className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
              <input
                id={emailId}
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required autoComplete="email" placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-[15px] transition focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-violet-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor={passwordId} className="block text-sm font-medium text-slate-700">Password</label>
                <button type="button" className="text-xs font-medium text-violet-600 hover:text-violet-800 transition">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id={passwordId}
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required autoComplete="current-password" placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-[15px] transition focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-violet-500"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-[15px] transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{ background: 'linear-gradient(90deg, #7c3aed, #4f46e5)', boxShadow: '0 4px 24px rgba(124, 58, 237, 0.35)' }}>
              {loading
                ? <span className="flex items-center justify-center gap-2"><Spinner /> Signing in…</span>
                : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function NLogo() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 16 L3 4 L8.5 4 L14 12 L14 4 L17 4 L17 16 L11.5 16 L6 8 L6 16 Z" fill="white" fillOpacity="0.95" /></svg>
}
function Eye() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
}
function EyeOff() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
}
function Spinner() {
  return <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
}

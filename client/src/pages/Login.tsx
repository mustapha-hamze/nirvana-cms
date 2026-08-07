import { useId, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAppDispatch } from '../store/hooks'
import { loginSuccess, type AuthUser } from '../store/authSlice'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import LocaleToggle from '../components/ui/LocaleToggle'
import { useLocale } from '../i18n/useLocale'

export default function Login() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { t, locale } = useLocale()
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
      const data = await api.post<{ token: string; refreshToken: string; user: AuthUser }>('/auth/login', { email, password })
      const { user } = data

      if (user.role !== 'SuperAdmin' && user.applications.length === 0) {
        setError(t('auth.errorNotAssigned'))
        return
      }
      // WebsiteUser has no screens in this admin panel today — every /applications/:id
      // route excludes it (see ProtectedRoute in App.tsx). Without this check the user
      // would authenticate successfully and then get silently bounced back to /login,
      // which reads as a broken login rather than a permissions gap.
      if (user.role === 'WebsiteUser') {
        setError(t('auth.errorNoAccess'))
        return
      }

      dispatch(loginSuccess({ token: data.token, refreshToken: data.refreshToken, user }))
      navigate(
        user.role === 'SuperAdmin' ? '/applications' : `/applications/${user.applications[0]._id}/dashboard`,
        { replace: true },
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.errorLoginFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`flex min-h-screen ${locale === 'fa' ? 'font-[family-name:var(--font-vazirmatn)]' : 'font-sans'}`}>

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
          <span className="text-white/80 font-semibold text-lg tracking-wide">{t('nav.brandName')}</span>
        </div>

        <div className="relative z-10 space-y-1">
          <p className="text-white/40 text-xs font-semibold tracking-[0.25em] uppercase mb-8">
            {t('auth.brandTagline')}
          </p>
          <h1 className="text-[3.25rem] font-bold leading-[1.15] tracking-tight text-white">
            {t('auth.heroHeadlineLine1')}
          </h1>
          <h2 className="text-[3.25rem] font-bold leading-[1.15] tracking-tight"
            style={{ background: 'linear-gradient(90deg, #c4b5fd, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {t('auth.heroHeadlineLine2')}
          </h2>
          <p className="text-2xl font-light pt-5" style={{ color: 'rgba(196, 181, 253, 0.6)' }}>
            {t('auth.welcomeToNirvanaBefore')}
            <span className="font-semibold" style={{ color: 'rgba(196, 181, 253, 0.9)' }}>{t('auth.welcomeToNirvanaBrand')}</span>
            {t('auth.welcomeToNirvanaAfter')}
          </p>
        </div>

        <p className="relative z-10 text-white/20 text-xs">
          {t('auth.copyright', { year: new Date().getFullYear() })}
        </p>
      </div>

      {/* ── Right: login form ──────────────────────────────────────────── */}
      <div className="relative flex-1 flex items-center justify-center px-8 py-16 bg-slate-50">
        <div className="absolute top-6 end-6">
          <LocaleToggle
            className="text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            contentClassName="border-slate-200 bg-white text-slate-900"
          />
        </div>
        <div className="w-full max-w-100">

          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
              <NLogo />
            </div>
            <span className="text-slate-800 font-semibold text-lg">{t('nav.brandName')}</span>
          </div>

          <div className="mb-9">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{t('auth.welcomeBack')}</h2>
            <p className="text-slate-500 mt-2 text-[15px]">{t('auth.signInSubtitle')}</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-5 border-red-100 bg-red-50">
              <AlertDescription className="text-red-600">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor={emailId} className="block text-sm font-medium text-slate-700 mb-1.5">{t('auth.emailAddress')}</label>
              <Input
                id={emailId}
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required autoComplete="email" placeholder="you@example.com" dir="ltr"
                className="h-auto w-full rounded-xl border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 focus-visible:border-violet-500 focus-visible:ring-violet-500/60"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor={passwordId} className="block text-sm font-medium text-slate-700">{t('auth.password')}</label>
                <button type="button" className="text-xs font-medium text-violet-600 hover:text-violet-800 transition">
                  {t('auth.forgotPassword')}
                </button>
              </div>
              <div className="relative">
                <Input
                  id={passwordId}
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required autoComplete="current-password" placeholder="••••••••"
                  className="h-auto w-full rounded-xl border-slate-200 bg-white px-4 py-3 pe-12 text-[15px] text-slate-900 placeholder:text-slate-400 focus-visible:border-violet-500 focus-visible:ring-violet-500/60"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute end-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading}
              className="mt-2 h-auto w-full rounded-xl py-3 text-[15px] font-semibold text-white transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(90deg, #7c3aed, #4f46e5)', boxShadow: '0 4px 24px rgba(124, 58, 237, 0.35)' }}>
              {loading
                ? <span className="flex items-center justify-center gap-2"><Spinner /> {t('auth.signingIn')}</span>
                : t('auth.signIn')}
            </Button>
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

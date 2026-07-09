import { useEffect, useState } from 'react'
import { theme } from '../../theme'
import { AlertCircleIcon, CheckCircleIcon, CloseIcon } from '../icons'
import type { ToastType } from './toastContext'

type Toast = { id: number; message: string; type: ToastType; exiting: boolean }

export default function ToastItem({
  toast,
  durationMs,
  onClose,
}: {
  toast: Toast
  durationMs: number
  onClose: () => void
}) {
  // Starts off-screen/invisible; flips to true one frame after mount so the
  // browser actually paints the "from" state before transitioning to it —
  // otherwise it'd coalesce both and skip the enter animation.
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const visible = entered && !toast.exiting

  const palette = toast.type === 'error'
    ? { bg: theme.dangerBg, border: theme.dangerBorder, color: theme.danger, Icon: AlertCircleIcon }
    : { bg: theme.successBg, border: 'rgba(52,211,153,0.3)', color: theme.success, Icon: CheckCircleIcon }

  return (
    <div
      className="pointer-events-auto relative overflow-hidden rounded-xl shadow-2xl text-sm font-medium transition-all duration-200 ease-out"
      style={{
        // `palette.bg` is a low-alpha tint meant to sit over an opaque surface
        // (it's reused from badge styling elsewhere) — layer it over theme.surface
        // here so the toast itself isn't see-through.
        background: `linear-gradient(${palette.bg}, ${palette.bg}), ${theme.surface}`,
        border: `1px solid ${palette.border}`,
        color: palette.color,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(-16px)',
      }}
    >
      <div className="flex items-center gap-3 pl-4 pr-3 py-3">
        <span className="shrink-0 flex">
          <palette.Icon size={18} />
        </span>
        <span className="flex-1">{toast.message}</span>
        <button
          type="button"
          onClick={onClose}
          title="Dismiss"
          className="shrink-0 p-0.5 rounded-lg transition"
          style={{ color: palette.color, opacity: 0.7 }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
        >
          <CloseIcon size={14} />
        </button>
      </div>
      {/* Full width at mount, animates to empty over `durationMs` — a visual
          countdown to the auto-dismiss. Tied to the same `entered` flip as
          the enter animation so it starts right as the toast settles in. */}
      <div className="absolute bottom-0 left-0 h-0.5 w-full" style={{ background: theme.overlaySubtle }}>
        <div
          style={{
            height: '100%',
            background: palette.color,
            width: entered && !toast.exiting ? '0%' : '100%',
            transitionProperty: 'width',
            transitionDuration: entered && !toast.exiting ? `${durationMs}ms` : '0ms',
            transitionTimingFunction: 'linear',
          }}
        />
      </div>
    </div>
  )
}

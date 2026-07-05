import { useCallback, useRef, useState, type ReactNode } from 'react'
import { ToastContext, type ToastType } from './toastContext'
import ToastItem from './ToastItem'

type Toast = { id: number; message: string; type: ToastType; exiting: boolean }

const AUTO_DISMISS_MS = 7000
// Must match ToastItem's `duration-200` exit transition — long enough for the
// fade/slide-out to finish before the toast is actually removed from the DOM.
const EXIT_ANIMATION_MS = 200

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const dismissTimers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const startExit = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)))
    setTimeout(() => removeToast(id), EXIT_ANIMATION_MS)
  }, [removeToast])

  const handleClose = useCallback((id: number) => {
    const timer = dismissTimers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      dismissTimers.current.delete(id)
    }
    startExit(id)
  }, [startExit])

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type, exiting: false }])
    dismissTimers.current.set(id, setTimeout(() => startExit(id), AUTO_DISMISS_MS))
  }, [startExit])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Fixed top-left, above everything including modals. */}
      <div className="fixed top-4 left-4 z-100 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} durationMs={AUTO_DISMISS_MS} onClose={() => handleClose(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

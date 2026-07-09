import type { ReactNode } from 'react'
import { theme } from '../../theme'
import { CloseIcon } from '../icons'

export function Backdrop({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ background: 'rgba(5,10,24,0.75)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="min-h-full flex items-center justify-center py-8"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        {children}
      </div>
    </div>
  )
}

export function ModalPanel({ children, maxWidth = 'max-w-md' }: { children: ReactNode; maxWidth?: string }) {
  return (
    <div
      className={`rounded-2xl shadow-2xl w-full ${maxWidth} mx-4 overflow-hidden`}
      style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
    >
      {children}
    </div>
  )
}

export function ModalHeader({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) {
  return (
    <div
      className="flex items-center justify-between px-6 pt-6 pb-5 shrink-0"
      style={{ borderBottom: `1px solid ${theme.border}` }}
    >
      <div>
        <h2 className="text-lg font-semibold" style={{ color: theme.textPrimary }}>{title}</h2>
        {subtitle && <p className="text-sm mt-0.5" style={{ color: theme.textSecondary }}>{subtitle}</p>}
      </div>
      <button
        onClick={onClose}
        className="p-1.5 rounded-lg transition"
        style={{ color: theme.textFaint }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = theme.textPrimary
          e.currentTarget.style.background = theme.hoverBgSubtle
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = theme.textFaint
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <CloseIcon />
      </button>
    </div>
  )
}

export function ModalFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-3 px-6 pb-6 shrink-0" style={{ paddingTop: '4px' }}>
      {children}
    </div>
  )
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="px-4 py-3 rounded-xl text-sm"
      style={{ background: theme.dangerBg, border: `1px solid ${theme.dangerBorder}`, color: theme.danger }}
    >
      {message}
    </div>
  )
}

export function CancelButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button" onClick={onClick} disabled={disabled}
      className="px-4 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-60"
      style={{ color: theme.textSecondary }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = theme.hoverBgSubtle
        e.currentTarget.style.color = theme.textPrimary
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = theme.textSecondary
      }}
    >
      Cancel
    </button>
  )
}

export function PrimaryButton({
  type = 'button',
  onClick,
  disabled,
  formId,
  danger,
  children,
}: {
  type?: 'button' | 'submit'
  onClick?: () => void
  disabled?: boolean
  formId?: string
  danger?: boolean
  children: ReactNode
}) {
  return (
    <button
      type={type} onClick={onClick} disabled={disabled} form={formId}
      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60"
      style={danger
        ? { background: theme.dangerSolid, boxShadow: '0 2px 12px rgba(220,38,38,0.35)' }
        : { background: theme.accentGradient, boxShadow: '0 2px 12px rgba(124,58,237,0.35)' }
      }
    >
      {children}
    </button>
  )
}

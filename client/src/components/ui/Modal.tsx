import type { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { useLocale } from '../../i18n/useLocale'

export function Backdrop({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      {children}
    </Dialog>
  )
}

export function ModalPanel({ children, maxWidth = 'max-w-md' }: { children: ReactNode; maxWidth?: string }) {
  return (
    <DialogContent className={cn('gap-0 p-0', maxWidth)}>
      {children}
    </DialogContent>
  )
}

export function ModalHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <DialogHeader className="border-b px-6 pt-6 pb-5">
      <DialogTitle>{title}</DialogTitle>
      {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
    </DialogHeader>
  )
}

export function ModalFooter({ children }: { children: ReactNode }) {
  return <DialogFooter className="px-6 pt-1 pb-6">{children}</DialogFooter>
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

export function CancelButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  const { t } = useLocale()
  return (
    <Button type="button" variant="outline" onClick={onClick} disabled={disabled}>
      {t('common.cancel')}
    </Button>
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
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled}
      form={formId}
      variant={danger ? 'destructive' : 'default'}
    >
      {children}
    </Button>
  )
}

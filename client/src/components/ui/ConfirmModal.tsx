import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { ErrorBanner } from './Modal'
import { useLocale } from '../../i18n/useLocale'

type Props = {
  title: string
  message: string
  confirmLabel: string
  loadingLabel: string
  onConfirm: () => Promise<void>
  onClose: () => void
}

export default function ConfirmModal({ title, message, confirmLabel, loadingLabel, onConfirm, onClose }: Props) {
  const { t } = useLocale()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleConfirm() {
    setError('')
    setLoading(true)
    try {
      await onConfirm()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.unknownError'))
      setLoading(false)
    }
  }

  return (
    <AlertDialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        {error && <ErrorBanner message={error} />}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{t('common.cancel')}</AlertDialogCancel>
          <Button variant="destructive" disabled={loading} onClick={handleConfirm}>
            {loading ? loadingLabel : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

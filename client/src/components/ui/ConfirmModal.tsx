import { useState } from 'react'
import { theme } from '../../theme'
import { Backdrop, ModalPanel, ErrorBanner, CancelButton, PrimaryButton } from './Modal'

type Props = {
  title: string
  message: string
  confirmLabel: string
  loadingLabel: string
  onConfirm: () => Promise<void>
  onClose: () => void
}

export default function ConfirmModal({ title, message, confirmLabel, loadingLabel, onConfirm, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleConfirm() {
    setError('')
    setLoading(true)
    try {
      await onConfirm()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <Backdrop onClose={onClose}>
      <ModalPanel>
        <div className="px-6 pt-6 pb-5">
          <h2 className="text-lg font-semibold" style={{ color: theme.textPrimary }}>{title}</h2>
          <p className="text-sm mt-2 leading-relaxed" style={{ color: theme.textSecondary }}>{message}</p>
          {error && <div className="mt-4"><ErrorBanner message={error} /></div>}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <CancelButton onClick={onClose} disabled={loading} />
          <PrimaryButton onClick={handleConfirm} disabled={loading} danger>
            {loading ? loadingLabel : confirmLabel}
          </PrimaryButton>
        </div>
      </ModalPanel>
    </Backdrop>
  )
}

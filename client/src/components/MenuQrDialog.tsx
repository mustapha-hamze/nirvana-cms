import { useEffect, useState } from 'react'
import { Backdrop, ModalPanel, ModalHeader, ModalFooter, ErrorBanner, CancelButton } from './ui/Modal'
import { Button } from '@/components/ui/button'
import { DownloadIcon } from './icons'
import { getMenuQrCode } from '../api/client'
import { useLocale } from '../i18n/useLocale'
import type { Menu } from '../types/menu'

// The QR endpoint is JWT-authenticated, so the image can't be loaded via a
// plain <img src="/api/menus/:id/qr-code"> — it's fetched as a Blob and
// turned into an object URL instead (see api/client.ts's getMenuQrCode).
export default function MenuQrDialog({ menu, onClose }: { menu: Menu; onClose: () => void }) {
  const { t } = useLocale()
  const [pngUrl, setPngUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null
    setLoading(true)
    setError('')
    getMenuQrCode(menu._id, 'png')
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setPngUrl(objectUrl)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t('menuQr.loadFailed'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [menu._id, t])

  async function handleDownload(format: 'png' | 'svg') {
    try {
      const blob = format === 'png' && pngUrl ? await (await fetch(pngUrl)).blob() : await getMenuQrCode(menu._id, format)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${menu.slug}-qr-code.${format}`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('menuQr.loadFailed'))
    }
  }

  return (
    <Backdrop onClose={onClose}>
      <ModalPanel>
        <ModalHeader title={t('menuQr.title')} subtitle={t('menuQr.subtitle')} />
        <div className="px-6 py-5 space-y-4">
          {error && <ErrorBanner message={error} />}
          <div className="flex items-center justify-center rounded-xl border bg-card p-6 min-h-56">
            {loading ? (
              <span className="text-sm text-muted-foreground">{t('menuQr.loading')}</span>
            ) : pngUrl ? (
              <img src={pngUrl} alt={menu.slug} className="w-48 h-48" />
            ) : null}
          </div>
        </div>
        <ModalFooter>
          <CancelButton onClick={onClose} />
          <Button type="button" variant="outline" onClick={() => handleDownload('svg')} disabled={loading || !!error}>
            <DownloadIcon size={14} />
            {t('menuQr.downloadSvg')}
          </Button>
          <Button type="button" onClick={() => handleDownload('png')} disabled={loading || !!error}>
            <DownloadIcon size={14} />
            {t('menuQr.download')}
          </Button>
        </ModalFooter>
      </ModalPanel>
    </Backdrop>
  )
}

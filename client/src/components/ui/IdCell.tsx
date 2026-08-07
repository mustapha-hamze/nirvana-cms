import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CopyIcon, CheckCircleIcon } from '../icons'
import { useLocale } from '../../i18n/useLocale'

// Truncated, monospace id with a click-to-copy button — used wherever an
// admin list shows a document's id (Pages' raw Mongo id, Categories'/Tags'
// short publicId) so it can be referenced in support conversations or API
// calls without a long id crowding the row.
export default function IdCell({ id }: { id: string }) {
  const { t } = useLocale()
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const truncated = id.length > 8

  return (
    <div className="flex items-center gap-1.5">
      <span title={id} dir="ltr" className="font-mono text-xs text-(--color-text-tertiary)">
        {truncated ? `${id.slice(0, 8)}…` : id}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={handleCopy}
        title={copied ? t('common.copied') : t('common.copyId')}
        className={copied ? 'text-(--color-success) hover:text-(--color-success)' : 'text-(--color-text-tertiary) hover:text-foreground'}
      >
        {copied ? <CheckCircleIcon size={13} /> : <CopyIcon size={13} />}
      </Button>
    </div>
  )
}

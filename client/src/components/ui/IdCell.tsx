import { useState } from 'react'
import { theme } from '../../theme'
import { CopyIcon, CheckCircleIcon } from '../icons'

// Truncated, monospace id with a click-to-copy button — used wherever an
// admin list shows a document's id (Pages' raw Mongo id, Categories'/Tags'
// short publicId) so it can be referenced in support conversations or API
// calls without a long id crowding the row.
export default function IdCell({ id }: { id: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const truncated = id.length > 8

  return (
    <div className="flex items-center gap-1.5">
      <span
        title={id}
        className="font-mono text-xs"
        style={{ color: theme.textTertiary }}
      >
        {truncated ? `${id.slice(0, 8)}…` : id}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        title={copied ? 'Copied!' : 'Copy id'}
        className="p-1 rounded-md transition"
        style={{ color: copied ? theme.success : theme.textTertiary }}
        onMouseEnter={(e) => { if (!copied) e.currentTarget.style.color = theme.textPrimary }}
        onMouseLeave={(e) => { if (!copied) e.currentTarget.style.color = theme.textTertiary }}
      >
        {copied ? <CheckCircleIcon size={13} /> : <CopyIcon size={13} />}
      </button>
    </div>
  )
}

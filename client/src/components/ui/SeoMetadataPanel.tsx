import { theme } from '../../theme'
import { ChevronIcon } from '../icons'
import { TextField, TextAreaField } from './FormField'
import KeywordsField from './KeywordsField'

type Metadata = { keywords: string[]; author: string; description: string }

// Collapsible "SEO & Metadata" panel shared by ContentForm and PageForm —
// both drafts carry the exact same metadata shape (author/description/keywords).
export default function SeoMetadataPanel({
  open,
  onToggle,
  metadata,
  onChange,
  isRtl,
}: {
  open: boolean
  onToggle: () => void
  metadata: Metadata
  onChange: (patch: Partial<Metadata>) => void
  isRtl: boolean
}) {
  return (
    <>
      <div style={{ borderTop: `1px solid ${theme.border}` }} />

      <div>
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-1.5 text-sm font-medium transition"
          style={{ color: theme.textSecondary }}
          onMouseEnter={(e) => (e.currentTarget.style.color = theme.textPrimary)}
          onMouseLeave={(e) => (e.currentTarget.style.color = theme.textSecondary)}
        >
          <ChevronIcon open={open} size={14} />
          SEO &amp; Metadata
        </button>
        {open && (
          <div className="mt-4 space-y-4">
            <TextField
              label="Author"
              value={metadata.author}
              onChange={(v) => onChange({ author: v })}
              placeholder="e.g. Jane Doe"
              dir={isRtl ? 'rtl' : 'ltr'}
            />
            <TextAreaField
              label="Meta Description"
              value={metadata.description}
              onChange={(v) => onChange({ description: v })}
              placeholder="Shown in search engine results…"
              dir={isRtl ? 'rtl' : 'ltr'}
            />
            <KeywordsField
              value={metadata.keywords}
              onChange={(keywords) => onChange({ keywords })}
            />
          </div>
        )}
      </div>
    </>
  )
}

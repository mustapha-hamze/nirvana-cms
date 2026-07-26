import { Separator } from '@/components/ui/separator'
import CollapsibleSectionHeader from './CollapsibleSectionHeader'
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
      <Separator />

      <div>
        <CollapsibleSectionHeader open={open} onToggle={onToggle} label="SEO & Metadata" />
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

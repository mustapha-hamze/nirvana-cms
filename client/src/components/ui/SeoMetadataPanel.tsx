import { Separator } from '@/components/ui/separator'
import CollapsibleSectionHeader from './CollapsibleSectionHeader'
import { TextField, TextAreaField } from './FormField'
import KeywordsField from './KeywordsField'
import { useLocale } from '../../i18n/useLocale'

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
  const { t } = useLocale()
  return (
    <>
      <Separator />

      <div>
        <CollapsibleSectionHeader open={open} onToggle={onToggle} label={t('builder.seoMetadata')} />
        {open && (
          <div className="mt-4 space-y-4">
            <TextField
              label={t('builder.author')}
              value={metadata.author}
              onChange={(v) => onChange({ author: v })}
              placeholder={t('builder.authorPlaceholder')}
              dir={isRtl ? 'rtl' : 'ltr'}
            />
            <TextAreaField
              label={t('builder.metaDescription')}
              value={metadata.description}
              onChange={(v) => onChange({ description: v })}
              placeholder={t('builder.metaDescriptionPlaceholder')}
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

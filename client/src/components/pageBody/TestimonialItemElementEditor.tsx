import { TextField, TextAreaField } from '../ui/FormField'
import ImageUploadField from '../body/ImageUploadField'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ReviewIcon } from '../icons'
import { useLocale } from '../../i18n/useLocale'
import type { TestimonialItemElement } from '../../types/page'

// Shared by Quotation, Testimonial, and Review components — see
// PAGE_COMPONENT_LAYOUTS in constants/pageSections.ts for why they use the same element.
// `rating` is meaningful for Review and simply left unset (null) elsewhere.
export default function TestimonialItemElementEditor({
  applicationId,
  element,
  onChange,
}: {
  applicationId: string
  element: TestimonialItemElement
  onChange: (next: TestimonialItemElement) => void
}) {
  const { t } = useLocale()
  return (
    <div className="space-y-3">
      <TextAreaField label={t('pageBuilder.quote')} required value={element.quote} onChange={(quote) => onChange({ ...element, quote })} rows={3} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label={t('pageBuilder.authorName')} value={element.authorName} onChange={(authorName) => onChange({ ...element, authorName })} />
        <TextField label={t('pageBuilder.authorRole')} value={element.authorRole} onChange={(authorRole) => onChange({ ...element, authorRole })} placeholder={t('pageBuilder.authorRolePlaceholder')} />
      </div>
      <ImageUploadField domain="page" applicationId={applicationId} url={element.avatar} onUploaded={(avatar) => onChange({ ...element, avatar })} />

      <div>
        <Label className="mb-1.5 text-sm font-medium text-muted-foreground">
          {t('pageBuilder.rating')}
        </Label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Button
              key={star}
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onChange({ ...element, rating: element.rating === star ? null : star })}
              title={t(star > 1 ? 'pageBuilder.starOther' : 'pageBuilder.starOne', { count: star })}
              className={`hover:bg-transparent ${element.rating !== null && star <= element.rating ? 'text-yellow-400' : 'text-(--color-text-tertiary)'}`}
            >
              <ReviewIcon size={22} />
            </Button>
          ))}
          {element.rating !== null && (
            <Button
              type="button"
              variant="link"
              onClick={() => onChange({ ...element, rating: null })}
              className="ms-2 h-auto p-0 text-xs font-medium text-muted-foreground hover:no-underline"
            >
              {t('pageBuilder.clear')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

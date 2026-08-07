import { TextField } from '../ui/FormField'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useLocale } from '../../i18n/useLocale'
import type { LinkElement } from '../../types/content'

export default function LinkElementEditor({
  element,
  onChange,
}: {
  element: LinkElement
  onChange: (next: LinkElement) => void
}) {
  const { t } = useLocale()
  return (
    <div className="space-y-3">
      <TextField label={t('contentBuilder.linkUrl')} required value={element.url} onChange={(url) => onChange({ ...element, url })} placeholder={t('contentBuilder.linkUrlPlaceholder')} />
      <TextField label={t('contentBuilder.label')} required value={element.label} onChange={(label) => onChange({ ...element, label })} placeholder={t('contentBuilder.labelPlaceholder')} />
      <Label className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
        <Checkbox checked={element.newTab} onCheckedChange={(checked) => onChange({ ...element, newTab: checked === true })} />
        {t('contentBuilder.openInNewTab')}
      </Label>
    </div>
  )
}

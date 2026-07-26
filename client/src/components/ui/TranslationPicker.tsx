import { Button } from '@/components/ui/button'
import { LANGUAGE_LABELS, type LangKey } from '../../types/content'

// "Select a language to add a translation for" block shown when a
// ContentForm/PageForm has no active language selected (either on first load
// of a brand-new item, or after picking "New Language").
export default function TranslationPicker({
  availableLangs,
  onPick,
}: {
  availableLangs: LangKey[]
  onPick: (lang: LangKey) => void
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Select a language to add a translation for:
      </p>
      <div className="flex flex-wrap gap-2">
        {availableLangs.map((lang) => (
          <Button key={lang} type="button" variant="outline" onClick={() => onPick(lang)}>
            {LANGUAGE_LABELS[lang]}
          </Button>
        ))}
      </div>
    </div>
  )
}

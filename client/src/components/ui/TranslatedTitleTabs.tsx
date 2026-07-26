import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LANGUAGE_LABELS, type LangKey } from '../../types/content'

// Language tab row for TagModal/CategoryModal — unlike TranslationTabs (used
// by ContentForm/PageForm), every allowed language always has a tab (there's
// no per-language add/discard here, just one title field per language), and
// the dot marks "has a title" rather than publish status.
export default function TranslatedTitleTabs({
  allowedLanguages,
  activeLang,
  titles,
  onSelect,
}: {
  allowedLanguages: LangKey[]
  activeLang: LangKey
  titles: Partial<Record<LangKey, string>>
  onSelect: (lang: LangKey) => void
}) {
  if (allowedLanguages.length <= 1) return null

  return (
    <div className="border-b px-6 pt-4">
      <Tabs value={activeLang} onValueChange={(v) => onSelect(v as LangKey)}>
        <TabsList variant="line" className="h-auto gap-1 bg-transparent p-0">
          {allowedLanguages.map((lang) => {
            const filled = !!titles[lang]?.trim()
            return (
              <TabsTrigger key={lang} value={lang} className="gap-1.5 px-3 py-2 after:bg-primary">
                {filled && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                {LANGUAGE_LABELS[lang]}
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>
    </div>
  )
}

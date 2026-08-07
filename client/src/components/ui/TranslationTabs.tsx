import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlusIcon } from '../icons'
import { useLocale } from '../../i18n/useLocale'
import { LANGUAGE_LABELS, type LangKey } from '../../types/content'

const NEW_LANGUAGE = '__new__'

// Language-switcher tab row shared by ContentForm and PageForm — one tab per
// language already drafted (with a status dot), plus a "New Language" tab
// when there's still an allowed language without a draft.
export default function TranslationTabs({
  existingLangs,
  availableLangs,
  activeLang,
  drafts,
  onSelect,
}: {
  existingLangs: LangKey[]
  availableLangs: LangKey[]
  activeLang: LangKey | null
  drafts: Partial<Record<LangKey, { status: 'draft' | 'published' }>>
  onSelect: (lang: LangKey | null) => void
}) {
  const { t } = useLocale()
  return (
    <div className="border-b px-6 pt-4">
      <Tabs
        value={activeLang ?? NEW_LANGUAGE}
        onValueChange={(v) => onSelect(v === NEW_LANGUAGE ? null : (v as LangKey))}
      >
        <TabsList variant="line" className="h-auto gap-1 bg-transparent p-0">
          {existingLangs.map((lang) => {
            const langDraft = drafts[lang]
            return (
              <TabsTrigger key={lang} value={lang} className="gap-1.5 px-3 py-2 after:bg-primary">
                {langDraft && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${langDraft.status === 'published' ? 'bg-(--color-success)' : 'bg-(--color-text-tertiary)'}`}
                  />
                )}
                {LANGUAGE_LABELS[lang]}
              </TabsTrigger>
            )
          })}
          {availableLangs.length > 0 && (
            <TabsTrigger value={NEW_LANGUAGE} className="gap-1.5 px-3 py-2 after:bg-primary">
              <PlusIcon size={14} />
              {t('builder.newLanguage')}
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>
    </div>
  )
}

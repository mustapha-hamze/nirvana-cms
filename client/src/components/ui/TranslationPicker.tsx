import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SparkleIcon } from '../icons'
import AiGenerateTranslationDialog from './AiGenerateTranslationDialog'
import { useLocale } from '../../i18n/useLocale'
import { LANGUAGE_LABELS, type LangKey } from '../../types/content'

// "Select a language to add a translation for" block shown when a
// ContentForm/PageForm has no active language selected (either on first load
// of a brand-new item, or after picking "New Language"). Each available
// language can be started manually (onPick, unchanged) or, when `aiGenerate`
// is provided (only once the item is persisted — generation reads an
// existing translation from the database), generated as a draft with AI from
// one of the item's existing translations.
export default function TranslationPicker<TDraft>({
  availableLangs,
  onPick,
  aiGenerate,
  onGenerated,
}: {
  availableLangs: LangKey[]
  onPick: (lang: LangKey) => void
  aiGenerate?: {
    sourceLangKeys: LangKey[]
    onGenerate: (targetLangKey: LangKey, sourceLangKey: LangKey) => Promise<TDraft>
  }
  onGenerated?: (lang: LangKey, draft: TDraft) => void
}) {
  const { t } = useLocale()
  const [generateLang, setGenerateLang] = useState<LangKey | null>(null)
  const canGenerate = !!aiGenerate && aiGenerate.sourceLangKeys.length > 0

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {t('builder.selectLanguagePrompt')}
      </p>
      <div className="flex flex-wrap gap-2">
        {availableLangs.map((lang) => (
          <div key={lang} className="flex items-center gap-1">
            <Button type="button" variant="outline" onClick={() => onPick(lang)}>
              {LANGUAGE_LABELS[lang]}
            </Button>
            {canGenerate && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title={t('builder.generateWithAi', { lang: LANGUAGE_LABELS[lang] })}
                aria-label={t('builder.generateWithAi', { lang: LANGUAGE_LABELS[lang] })}
                onClick={() => setGenerateLang(lang)}
              >
                <SparkleIcon />
              </Button>
            )}
          </div>
        ))}
      </div>

      {generateLang && aiGenerate && (
        <AiGenerateTranslationDialog
          targetLangKey={generateLang}
          sourceLangKeys={aiGenerate.sourceLangKeys}
          onGenerate={(sourceLangKey) => aiGenerate.onGenerate(generateLang, sourceLangKey)}
          onGenerated={(draft) => onGenerated?.(generateLang, draft)}
          onClose={() => setGenerateLang(null)}
        />
      )}
    </div>
  )
}

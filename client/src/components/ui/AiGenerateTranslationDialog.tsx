import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ErrorBanner } from './Modal'
import { LANGUAGE_LABELS, type LangKey } from '../../types/content'

// "Generate with AI" dialog opened from TranslationPicker — lets the user
// pick which existing translation to translate FROM, then calls the
// caller-provided `onGenerate` (the actual content- or page-specific API
// call) and hands the resulting draft back via `onGenerated` for the caller
// to insert into local draft state. Nothing is saved here — the generated
// draft still goes through the normal Save button, same as manual entry.
// Loading/error state follow the same local-state pattern as ConfirmModal.tsx.
export default function AiGenerateTranslationDialog<TDraft>({
  targetLangKey,
  sourceLangKeys,
  onGenerate,
  onGenerated,
  onClose,
}: {
  targetLangKey: LangKey
  sourceLangKeys: LangKey[]
  onGenerate: (sourceLangKey: LangKey) => Promise<TDraft>
  onGenerated: (draft: TDraft) => void
  onClose: () => void
}) {
  const [sourceLangKey, setSourceLangKey] = useState<LangKey>(sourceLangKeys[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGenerate() {
    setError('')
    setLoading(true)
    try {
      const draft = await onGenerate(sourceLangKey)
      onGenerated(draft)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate translation')
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate {LANGUAGE_LABELS[targetLangKey]} translation with AI</DialogTitle>
          <DialogDescription>
            Choose which existing translation to translate from. You'll be able to review and edit
            the result before saving — nothing is published automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-muted-foreground">Translate from</label>
          <Select value={sourceLangKey} onValueChange={(v) => setSourceLangKey(v as LangKey)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sourceLangKeys.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {LANGUAGE_LABELS[lang]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && <ErrorBanner message={error} />}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleGenerate} disabled={loading}>
            {loading ? 'Generating…' : 'Generate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

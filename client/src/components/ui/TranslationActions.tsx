import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { TrashIcon } from '../icons'
import { PrimaryButton } from './Modal'
import { LANGUAGE_LABELS, type LangKey } from '../../types/content'

// Bottom action bar shared by ContentForm and PageForm — Save on the left,
// and on the right either "Remove translation" (already persisted, admin
// only) or "Discard draft" (not yet saved) for the active language.
export default function TranslationActions({
  loading,
  saveLabel,
  onSave,
  activeLang,
  isPersisted,
  canManage,
  onRemove,
  onDiscard,
}: {
  loading: boolean
  saveLabel: string
  onSave: () => void
  activeLang: LangKey
  isPersisted: boolean
  canManage: boolean
  onRemove: () => void
  onDiscard: () => void
}) {
  return (
    <>
      <Separator />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <PrimaryButton onClick={onSave} disabled={loading}>
            {saveLabel}
          </PrimaryButton>
        </div>

        {isPersisted ? (
          canManage && (
            <Button
              type="button"
              variant="link"
              onClick={onRemove}
              className="h-auto gap-1.5 p-0 text-sm font-medium text-destructive hover:text-destructive/80"
            >
              <TrashIcon size={14} />
              Remove {LANGUAGE_LABELS[activeLang]} translation
            </Button>
          )
        ) : (
          <Button
            type="button"
            variant="link"
            onClick={onDiscard}
            className="h-auto gap-1.5 p-0 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <TrashIcon size={14} />
            Discard {LANGUAGE_LABELS[activeLang]} draft
          </Button>
        )}
      </div>
    </>
  )
}

import ConfirmModal from './ConfirmModal'
import { LANGUAGE_LABELS, type LangKey } from '../../types/content'

// Confirmation for removing an already-persisted translation — shared wording
// between ContentForm and PageForm, parametrized only by what the item is
// called ("content" / "page") and what actually performs the removal.
export default function TranslationRemoveConfirm({
  lang,
  itemLabel,
  onConfirm,
  onClose,
}: {
  lang: LangKey
  itemLabel: string
  onConfirm: () => Promise<void>
  onClose: () => void
}) {
  return (
    <ConfirmModal
      title={`Remove ${LANGUAGE_LABELS[lang]} translation?`}
      message={`This translation will be removed from this ${itemLabel}. This action cannot be undone.`}
      confirmLabel="Remove Translation"
      loadingLabel="Removing…"
      onConfirm={onConfirm}
      onClose={onClose}
    />
  )
}

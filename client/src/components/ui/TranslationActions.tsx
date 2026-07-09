import { theme } from '../../theme'
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
      <div style={{ borderTop: `1px solid ${theme.border}` }} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <PrimaryButton onClick={onSave} disabled={loading}>
            {saveLabel}
          </PrimaryButton>
        </div>

        {isPersisted ? (
          canManage && (
            <button
              type="button"
              onClick={onRemove}
              className="flex items-center gap-1.5 text-sm font-medium transition"
              style={{ color: theme.danger }}
              onMouseEnter={(e) => (e.currentTarget.style.color = theme.dangerHover)}
              onMouseLeave={(e) => (e.currentTarget.style.color = theme.danger)}
            >
              <TrashIcon size={14} />
              Remove {LANGUAGE_LABELS[activeLang]} translation
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={onDiscard}
            className="flex items-center gap-1.5 text-sm font-medium transition"
            style={{ color: theme.textSecondary }}
            onMouseEnter={(e) => (e.currentTarget.style.color = theme.textPrimary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = theme.textSecondary)}
          >
            <TrashIcon size={14} />
            Discard {LANGUAGE_LABELS[activeLang]} draft
          </button>
        )}
      </div>
    </>
  )
}

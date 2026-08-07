import ConfirmModal from './ConfirmModal'
import { useLocale } from '../../i18n/useLocale'
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
  const { t } = useLocale()
  return (
    <ConfirmModal
      title={t('builder.removeTranslationTitle', { lang: LANGUAGE_LABELS[lang] })}
      message={t('builder.removeTranslationMessage', { item: itemLabel })}
      confirmLabel={t('builder.removeTranslationConfirm')}
      loadingLabel={t('builder.removingTranslation')}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  )
}

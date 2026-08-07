import { Switch } from '@/components/ui/switch'
import { useLocale } from '../../i18n/useLocale'

export default function StatusToggle({
  checked,
  onToggle,
  disabled,
  onLabel,
  offLabel,
}: {
  checked: boolean
  onToggle: () => void
  disabled?: boolean
  onLabel?: string
  offLabel?: string
}) {
  const { t } = useLocale()
  const resolvedOnLabel = onLabel ?? t('common.enable')
  const resolvedOffLabel = offLabel ?? t('common.disable')
  return (
    <Switch
      checked={checked}
      onCheckedChange={onToggle}
      disabled={disabled}
      title={checked ? resolvedOffLabel : resolvedOnLabel}
      aria-label={checked ? resolvedOffLabel : resolvedOnLabel}
      className="data-[state=checked]:bg-(--color-success)"
    />
  )
}

import { Switch } from '@/components/ui/switch'

export default function StatusToggle({
  checked,
  onToggle,
  disabled,
  onLabel = 'Enable',
  offLabel = 'Disable',
}: {
  checked: boolean
  onToggle: () => void
  disabled?: boolean
  onLabel?: string
  offLabel?: string
}) {
  return (
    <Switch
      checked={checked}
      onCheckedChange={onToggle}
      disabled={disabled}
      title={checked ? offLabel : onLabel}
      aria-label={checked ? offLabel : onLabel}
      className="data-[state=checked]:bg-(--color-success)"
    />
  )
}

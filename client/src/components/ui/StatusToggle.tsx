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
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      title={checked ? offLabel : onLabel}
      aria-label={checked ? offLabel : onLabel}
      aria-pressed={checked}
      className="relative w-9 h-5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
      style={{ background: checked ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.1)' }}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
        style={{
          left: checked ? '18px' : '2px',
          background: checked ? '#34d399' : 'rgba(255,255,255,0.5)',
        }}
      />
    </button>
  )
}

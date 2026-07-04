export default function StatusToggle({
  status,
  onToggle,
  disabled,
  activeLabel = 'Deactivate',
  inactiveLabel = 'Activate',
}: {
  status: 'active' | 'inactive'
  onToggle: () => void
  disabled: boolean
  activeLabel?: string
  inactiveLabel?: string
}) {
  const isActive = status === 'active'
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      title={isActive ? activeLabel : inactiveLabel}
      aria-label={isActive ? activeLabel : inactiveLabel}
      aria-pressed={isActive}
      className="relative w-9 h-5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
      style={{ background: isActive ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.1)' }}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
        style={{
          left: isActive ? '18px' : '2px',
          background: isActive ? '#34d399' : 'rgba(255,255,255,0.5)',
        }}
      />
    </button>
  )
}

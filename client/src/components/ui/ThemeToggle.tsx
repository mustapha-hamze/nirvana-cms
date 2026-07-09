import { theme } from '../../theme'
import { SunIcon, MoonIcon } from '../icons'
import { useThemeMode } from './useThemeMode'

export default function ThemeToggle() {
  const { mode, toggleMode } = useThemeMode()
  const isDark = mode === 'dark'

  return (
    <button
      type="button"
      onClick={toggleMode}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="p-2 rounded-lg transition shrink-0"
      style={{ color: theme.textMuted }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = theme.textPrimary
        e.currentTarget.style.background = theme.hoverBgSubtle
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = theme.textMuted
        e.currentTarget.style.background = 'transparent'
      }}
    >
      {isDark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
    </button>
  )
}

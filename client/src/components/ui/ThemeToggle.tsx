import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { SunIcon, MoonIcon } from '../icons'
import { useThemeMode } from './useThemeMode'

export default function ThemeToggle() {
  const { mode, toggleMode } = useThemeMode()
  const isDark = mode === 'dark'
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleMode}
          aria-label={label}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          {isDark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

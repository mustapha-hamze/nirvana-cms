import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { ThemeModeContext, type ThemeMode } from './themeModeContext'

const STORAGE_KEY = 'nirvana-theme-mode'

function readStoredMode(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'light' ? 'light' : 'dark'
}

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(readStoredMode)

  // Reflected onto <html data-theme="..."> so the CSS custom properties in
  // index.css (which every theme.ts token reads from) resolve to the right
  // palette — see theme.ts for why this alone re-themes the whole app.
  useEffect(() => {
    document.documentElement.dataset.theme = mode
    localStorage.setItem(STORAGE_KEY, mode)
  }, [mode])

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>
      {children}
    </ThemeModeContext.Provider>
  )
}

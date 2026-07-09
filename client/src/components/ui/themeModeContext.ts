import { createContext } from 'react'

export type ThemeMode = 'dark' | 'light'

export type ThemeModeContextValue = {
  mode: ThemeMode
  toggleMode: () => void
}

export const ThemeModeContext = createContext<ThemeModeContextValue | null>(null)

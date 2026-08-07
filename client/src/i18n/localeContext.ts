import { createContext } from 'react'
import type { Direction, Locale, TranslationKey } from './types'

export type TranslationParams = Record<string, string | number>

export type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  dir: Direction
  t: (key: TranslationKey, params?: TranslationParams) => string
}

export const LocaleContext = createContext<LocaleContextValue | null>(null)

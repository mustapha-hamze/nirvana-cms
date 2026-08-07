import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getCookie, setCookie } from '../utils/cookies'
import { LocaleContext, type TranslationParams } from './localeContext'
import en from './locales/en'
import fa from './locales/fa'
import type { Direction, Locale, TranslationKey } from './types'

const COOKIE_KEY = 'nirvana_admin_locale'
const DICTIONARIES = { en, fa }

function readStoredLocale(): Locale {
  return getCookie(COOKIE_KEY) === 'fa' ? 'fa' : 'en'
}

function resolve(dict: Record<string, unknown>, key: TranslationKey): string | undefined {
  const value = key.split('.').reduce<unknown>((acc, part) => {
    return acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined
  }, dict)
  return typeof value === 'string' ? value : undefined
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(readStoredLocale)
  const dir: Direction = locale === 'fa' ? 'rtl' : 'ltr'

  // Reflected onto <html lang/dir> and persisted to a cookie (not
  // localStorage, unlike theme mode — see cookies.ts) so a fresh load can
  // read it before React hydrates the rest of the tree.
  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = dir
    setCookie(COOKIE_KEY, locale, 365)
  }, [locale, dir])

  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams): string => {
      const template = resolve(DICTIONARIES[locale], key) ?? resolve(en, key) ?? key
      if (!params) return template
      return template.replace(/\{(\w+)\}/g, (match, name) => {
        const value = params[name]
        return value === undefined ? match : String(value)
      })
    },
    [locale],
  )

  const value = useMemo(() => ({ locale, setLocale, dir, t }), [locale, dir, t])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

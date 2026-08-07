import type en from './locales/en'

// The canonical dictionary shape — `en.ts` is the source of truth (plain
// object literal, so its leaf types widen to `string`, not literal unions).
// `fa.ts` is typed against this so a missing/mistyped Persian key is a
// compile error rather than a silent English leak.
export type Dictionary = typeof en

// All dot-separated leaf paths through the dictionary, e.g. 'common.save' or
// 'nav.dashboard' — gives `t()` compile-time key checking/autocomplete.
export type TranslationKey = NestedKeyOf<Dictionary>

type NestedKeyOf<T> = {
  [K in keyof T & string]: T[K] extends string ? `${K}` : `${K}.${NestedKeyOf<T[K]>}`
}[keyof T & string]

export type Locale = 'en' | 'fa'
export type Direction = 'ltr' | 'rtl'

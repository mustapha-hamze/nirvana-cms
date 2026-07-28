export const LANGUAGES = Object.freeze({
  ENGLISH: 'en',
  PERSIAN: 'fa',
  FRENCH: 'fr',
} as const)

export type LangKey = (typeof LANGUAGES)[keyof typeof LANGUAGES]

export const LANGUAGE_VALUES = Object.values(LANGUAGES)

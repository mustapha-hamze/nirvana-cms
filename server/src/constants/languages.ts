export const LANGUAGES = Object.freeze({
  ENGLISH: 'en',
  PERSIAN: 'fa',
  FRENCH: 'fr',
} as const)

export type LangKey = (typeof LANGUAGES)[keyof typeof LANGUAGES]

export const LANGUAGE_VALUES = Object.values(LANGUAGES)

// Human-readable names for prompts/messages that need to name a language
// rather than just pass its code around (e.g. aiTranslationService.ts).
export const LANGUAGE_NAMES: Record<LangKey, string> = {
  [LANGUAGES.ENGLISH]: 'English',
  [LANGUAGES.PERSIAN]: 'Persian',
  [LANGUAGES.FRENCH]: 'French',
}

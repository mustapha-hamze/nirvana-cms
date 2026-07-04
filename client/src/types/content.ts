export type LangKey = 'en' | 'fa' | 'fr'

export const LANGUAGE_VALUES: LangKey[] = ['en', 'fa', 'fr']

export const LANGUAGE_LABELS: Record<LangKey, string> = {
  en: 'English',
  fa: 'Persian',
  fr: 'French',
}

export type ContentStatus = 'draft' | 'published'

export type ContentDetail = {
  _id: string
  content: string
  langKey: LangKey
  title: string
  headline: string
  abstract: string
  status: ContentStatus
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export type ContentItem = {
  _id: string
  application: string
  createdAt: string
  updatedAt: string
  details: ContentDetail[]
}

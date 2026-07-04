export type LangKey = 'en' | 'fa' | 'fr'

export const LANGUAGE_VALUES: LangKey[] = ['en', 'fa', 'fr']

export const LANGUAGE_LABELS: Record<LangKey, string> = {
  en: 'English',
  fa: 'Persian',
  fr: 'French',
}

export type ContentStatus = 'draft' | 'published'

export type ContentMetadata = {
  keywords: string[]
  author: string
  description: string
}

export type ContentDetail = {
  _id: string
  content: string
  application: string
  langKey: LangKey
  title: string
  slug: string
  headline: string
  abstract: string
  status: ContentStatus
  metadata: ContentMetadata
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export type ContentItem = {
  _id: string
  application: string
  createdAt: string
  updatedAt: string
  // Populated by the server — shared across every language translation.
  categories: { _id: string; title: string; parentId: string | null }[]
  tags: { _id: string; title: string }[]
  details: ContentDetail[]
}

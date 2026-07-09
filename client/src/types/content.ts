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
  sections: ContentSection[]
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

// --- Dynamic content body (sections/elements) ---
// Mirrors server/src/constants/elementTypes.js and server/src/models/content/Elements.js.
// The runtime catalogs (labels, layouts, factories) live in
// constants/contentSections.ts and factories/contentElements.ts — this file
// only declares the shapes.

export type ElementType = 'paragraph' | 'richText' | 'heading' | 'textInput' | 'image' | 'imageGallery' | 'link' | 'videoEmbed'

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export type ParagraphElement = { _id?: string; elementType: 'paragraph'; text: string }
export type RichTextElement = { _id?: string; elementType: 'richText'; html: string }
export type HeadingElement = { _id?: string; elementType: 'heading'; level: HeadingLevel; text: string }
export type TextInputElement = { _id?: string; elementType: 'textInput'; text: string }
export type GalleryImage = { url: string; alt: string; caption: string }
export type ImageElement = { _id?: string; elementType: 'image'; url: string; alt: string; caption: string }
export type ImageGalleryElement = { _id?: string; elementType: 'imageGallery'; images: GalleryImage[] }
export type LinkElement = { _id?: string; elementType: 'link'; url: string; label: string; newTab: boolean }
export type VideoEmbedElement = { _id?: string; elementType: 'videoEmbed'; url: string; caption: string }

export type ContentElement =
  | ParagraphElement
  | RichTextElement
  | HeadingElement
  | TextInputElement
  | ImageElement
  | ImageGalleryElement
  | LinkElement
  | VideoEmbedElement

// Mirrors server/src/constants/sectionTypes.js SECTION_TYPES.
export type SectionType =
  | 'text-1-col' | 'text-2-col' | 'text-image' | 'text-video' | 'video-text'
  | 'image-only' | 'image-2-up' | 'image-gallery' | 'video-only' | 'document'

export type SectionSlot = { elementTypes: ElementType[]; count: number }

export type ContentSection = {
  _id?: string
  // Client-only stable key for React/dnd-kit lists — never validated by the
  // server schema, so it's harmless if it ends up in a save payload (Mongoose
  // silently drops unknown subdocument fields), but callers should strip it
  // via toPersistableSections() before sending anyway, for a clean payload.
  cid?: string
  type: SectionType
  elements: ContentElement[]
}

export type ContentItem = {
  _id: string
  application: string
  createdAt: string
  updatedAt: string
  // Populated by the server — shared across every language translation. Each
  // category/tag itself carries one title per language (see Category/Tag
  // types), not one flat title.
  categories: { _id: string; translations: { langKey: LangKey; title: string; slug: string }[]; parentId: string | null }[]
  tags: { _id: string; translations: { langKey: LangKey; title: string; slug: string }[] }[]
  details: ContentDetail[]
}

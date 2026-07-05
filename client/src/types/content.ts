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

export type ElementType = 'paragraph' | 'richText' | 'heading' | 'textInput' | 'image' | 'imageGallery' | 'link' | 'videoEmbed'

export const ELEMENT_TYPE_LABELS: Record<ElementType, string> = {
  paragraph: 'Paragraph',
  richText: 'Rich Text',
  heading: 'Heading',
  textInput: 'Text Input',
  image: 'Image',
  imageGallery: 'Image Gallery',
  link: 'Link',
  videoEmbed: 'Video',
}

export const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const
export type HeadingLevel = (typeof HEADING_LEVELS)[number]

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

export const SECTION_TYPE_VALUES: SectionType[] = [
  'text-1-col', 'text-2-col', 'text-image', 'text-video', 'video-text',
  'image-only', 'image-2-up', 'image-gallery', 'video-only', 'document',
]

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  'text-1-col': 'Text (1 column)',
  'text-2-col': 'Text (2 columns)',
  'text-image': 'Text + Image',
  'text-video': 'Text + Video',
  'video-text': 'Video + Text',
  'image-only': 'Image',
  'image-2-up': 'Two Images',
  'image-gallery': 'Image Gallery',
  'video-only': 'Video',
  document: 'Plain Text',
}

export type SectionSlot = { elementTypes: ElementType[]; count: number }

// Mirrors server/src/constants/sectionTypes.js SECTION_LAYOUTS — the single
// source of truth for how many elements a layout holds, in what order, and
// which element type(s) each slot accepts. Kept in sync by hand since there's
// no shared package between client/server in this repo (same existing pattern
// as LANGUAGE_VALUES/LangKey being duplicated rather than imported).
const TEXT_ELEMENT_TYPES: ElementType[] = ['paragraph', 'richText', 'heading', 'textInput']

export const SECTION_LAYOUTS: Record<SectionType, { slots: SectionSlot[] }> = {
  'text-1-col': { slots: [{ elementTypes: TEXT_ELEMENT_TYPES, count: 1 }] },
  'text-2-col': { slots: [{ elementTypes: TEXT_ELEMENT_TYPES, count: 2 }] },
  'text-image': {
    slots: [
      { elementTypes: TEXT_ELEMENT_TYPES, count: 1 },
      { elementTypes: ['image'], count: 1 },
    ],
  },
  'text-video': {
    slots: [
      { elementTypes: TEXT_ELEMENT_TYPES, count: 1 },
      { elementTypes: ['videoEmbed'], count: 1 },
    ],
  },
  'video-text': {
    slots: [
      { elementTypes: ['videoEmbed'], count: 1 },
      { elementTypes: TEXT_ELEMENT_TYPES, count: 1 },
    ],
  },
  'image-only': { slots: [{ elementTypes: ['image'], count: 1 }] },
  'image-2-up': { slots: [{ elementTypes: ['image'], count: 2 }] },
  'image-gallery': { slots: [{ elementTypes: ['imageGallery'], count: 1 }] },
  'video-only': { slots: [{ elementTypes: ['videoEmbed'], count: 1 }] },
  // Plain text only, no rich formatting/headings/links — a bare document block.
  document: { slots: [{ elementTypes: ['paragraph'], count: 1 }] },
}

// Which element types are allowed at a given position within a section's
// elements array — used to show a type switcher only where there's an actual
// choice (e.g. a "text" slot can be paragraph/richText/heading/textInput, but
// an "image" slot has just one option).
export function getSlotElementTypes(type: SectionType, index: number): ElementType[] {
  let cursor = 0
  for (const slot of SECTION_LAYOUTS[type].slots) {
    if (index < cursor + slot.count) return slot.elementTypes
    cursor += slot.count
  }
  return []
}

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

export function createEmptyElementOfType(elementType: ElementType): ContentElement {
  switch (elementType) {
    case 'paragraph': return { elementType, text: '' }
    case 'richText': return { elementType, html: '' }
    case 'heading': return { elementType, level: 2, text: '' }
    case 'textInput': return { elementType, text: '' }
    case 'image': return { elementType, url: '', alt: '', caption: '' }
    case 'imageGallery':
      return { elementType, images: [{ url: '', alt: '', caption: '' }, { url: '', alt: '', caption: '' }] }
    case 'link': return { elementType, url: '', label: '', newTab: false }
    case 'videoEmbed': return { elementType, url: '', caption: '' }
  }
}

const TEXT_LIKE_ELEMENT_TYPES: ElementType[] = ['paragraph', 'richText', 'heading', 'textInput']

function extractPlainText(element: ContentElement): string {
  switch (element.elementType) {
    case 'paragraph': return element.text
    case 'heading': return element.text
    case 'textInput': return element.text
    case 'richText': return new DOMParser().parseFromString(element.html, 'text/html').body.textContent ?? ''
    default: return ''
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Switches an element to a different type, carrying its text over where
// possible — paragraph/richText/heading/textInput are all "just text" to the
// person editing, so switching between them shouldn't wipe what was typed.
// Switching to/from a non-text type (image, link, ...) can't meaningfully
// preserve anything, so that falls back to a blank element of the new type.
export function convertElementType(element: ContentElement, newType: ElementType): ContentElement {
  if (element.elementType === newType) return element
  if (!TEXT_LIKE_ELEMENT_TYPES.includes(newType) || !TEXT_LIKE_ELEMENT_TYPES.includes(element.elementType)) {
    return createEmptyElementOfType(newType)
  }
  const text = extractPlainText(element)
  switch (newType) {
    case 'paragraph': return { elementType: newType, text }
    case 'textInput': return { elementType: newType, text }
    case 'heading': return { elementType: newType, level: element.elementType === 'heading' ? element.level : 2, text }
    case 'richText': return { elementType: newType, html: text ? `<p>${escapeHtml(text)}</p>` : '' }
    default: return createEmptyElementOfType(newType)
  }
}

export function createEmptySection(type: SectionType): ContentSection {
  const elements: ContentElement[] = []
  for (const slot of SECTION_LAYOUTS[type].slots) {
    for (let i = 0; i < slot.count; i++) elements.push(createEmptyElementOfType(slot.elementTypes[0]))
  }
  return { cid: crypto.randomUUID(), type, elements }
}

// Assigns a stable client key to sections loaded from the server (which only
// carry a real `_id`), so freshly-loaded and freshly-created sections can
// share one dnd-kit/React key scheme.
export function withClientKeys(sections: ContentSection[]): ContentSection[] {
  return sections.map((s) => ({ ...s, cid: s.cid ?? s._id ?? crypto.randomUUID() }))
}

// Strips the client-only `cid` before sending sections to the API.
export function toPersistableSections(sections: ContentSection[]): ContentSection[] {
  return sections.map(({ cid: _cid, ...rest }) => rest)
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

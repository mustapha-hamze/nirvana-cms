export const ELEMENT_TYPES = Object.freeze({
  PARAGRAPH: 'paragraph',
  RICH_TEXT: 'richText',
  HEADING: 'heading',
  TEXT_INPUT: 'textInput',
  IMAGE: 'image',
  IMAGE_GALLERY: 'imageGallery',
  LINK: 'link',
  VIDEO_EMBED: 'videoEmbed',
} as const)

export type ElementType = (typeof ELEMENT_TYPES)[keyof typeof ELEMENT_TYPES]

export const HEADING_LEVELS = Object.freeze([1, 2, 3, 4, 5, 6] as const)

export const ELEMENT_TYPE_VALUES = Object.values(ELEMENT_TYPES)

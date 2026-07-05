import { ELEMENT_TYPES } from './elementTypes.js'

export const SECTION_TYPES = Object.freeze({
  TEXT_ONE_COLUMN: 'text-1-col',
  TEXT_TWO_COLUMN: 'text-2-col',
  TEXT_IMAGE: 'text-image',
  TEXT_VIDEO: 'text-video',
  VIDEO_TEXT: 'video-text',
  IMAGE_ONLY: 'image-only',
  IMAGE_TWO_UP: 'image-2-up',
  IMAGE_GALLERY: 'image-gallery',
  VIDEO_ONLY: 'video-only',
  DOCUMENT: 'document',
})

export const SECTION_TYPE_VALUES = Object.values(SECTION_TYPES)

const TEXT_ELEMENT_TYPES = [
  ELEMENT_TYPES.PARAGRAPH,
  ELEMENT_TYPES.RICH_TEXT,
  ELEMENT_TYPES.HEADING,
  ELEMENT_TYPES.TEXT_INPUT,
]

// The single source of truth for how many elements a section holds, in what
// order, and which element type(s) each slot accepts. Both the controller's
// validateSections() and the client editor read this to know a layout's shape
// — sections themselves have no Mongoose discriminator (see Section.js), so
// this table is what actually distinguishes one layout from another.
export const SECTION_LAYOUTS = Object.freeze({
  [SECTION_TYPES.TEXT_ONE_COLUMN]: {
    slots: [{ elementTypes: TEXT_ELEMENT_TYPES, count: 1 }],
  },
  [SECTION_TYPES.TEXT_TWO_COLUMN]: {
    slots: [{ elementTypes: TEXT_ELEMENT_TYPES, count: 2 }],
  },
  [SECTION_TYPES.TEXT_IMAGE]: {
    slots: [
      { elementTypes: TEXT_ELEMENT_TYPES, count: 1 },
      { elementTypes: [ELEMENT_TYPES.IMAGE], count: 1 },
    ],
  },
  [SECTION_TYPES.TEXT_VIDEO]: {
    slots: [
      { elementTypes: TEXT_ELEMENT_TYPES, count: 1 },
      { elementTypes: [ELEMENT_TYPES.VIDEO_EMBED], count: 1 },
    ],
  },
  [SECTION_TYPES.VIDEO_TEXT]: {
    slots: [
      { elementTypes: [ELEMENT_TYPES.VIDEO_EMBED], count: 1 },
      { elementTypes: TEXT_ELEMENT_TYPES, count: 1 },
    ],
  },
  [SECTION_TYPES.IMAGE_ONLY]: {
    slots: [{ elementTypes: [ELEMENT_TYPES.IMAGE], count: 1 }],
  },
  [SECTION_TYPES.IMAGE_TWO_UP]: {
    slots: [{ elementTypes: [ELEMENT_TYPES.IMAGE], count: 2 }],
  },
  [SECTION_TYPES.IMAGE_GALLERY]: {
    slots: [{ elementTypes: [ELEMENT_TYPES.IMAGE_GALLERY], count: 1 }],
  },
  [SECTION_TYPES.VIDEO_ONLY]: {
    slots: [{ elementTypes: [ELEMENT_TYPES.VIDEO_EMBED], count: 1 }],
  },
  // Plain text only, no rich formatting or links — a bare document/plain-text block.
  [SECTION_TYPES.DOCUMENT]: {
    slots: [{ elementTypes: [ELEMENT_TYPES.PARAGRAPH], count: 1 }],
  },
})

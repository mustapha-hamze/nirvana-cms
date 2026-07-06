import { PAGE_ELEMENT_TYPES } from './pageElementTypes.js'

export const PAGE_SECTION_TYPES = Object.freeze({
  SLIDER: 'slider',
  BANNER: 'banner',
  TEXT: 'text',
  CARDS: 'cards',
  TABS: 'tabs',
  ACCORDION: 'accordion',
  FAQ: 'faq',
  CAROUSEL: 'carousel',
  IMAGE: 'image',
  PRICING: 'pricing',
  STEPS: 'steps',
  TEAM: 'team',
  QUOTATION: 'quotation',
  TESTIMONIAL: 'testimonial',
  REVIEW: 'review',
  VIDEO: 'video',
  CHART: 'chart',
  GALLERY: 'gallery',
  CTA: 'cta',
  STATISTICS: 'statistics',
  TIMELINE: 'timeline',
  MAP: 'map',
  PORTFOLIO: 'portfolio',
})

export const PAGE_SECTION_TYPE_VALUES = Object.values(PAGE_SECTION_TYPES)

// Unlike Content's SECTION_LAYOUTS (fixed multi-slot layouts, e.g. exactly one
// text + one image), every page section here is a homogeneous, *variable*-length
// list of one element type — a hero has 1-10 slides, a team section has 1-24
// members, and so on. So the rule per type is just { elementType, min, max),
// not Content's ordered `slots` array. This is the single source of truth the
// admin editor and pageController's validatePageSections() both read.
export const PAGE_SECTION_LAYOUTS = Object.freeze({
  [PAGE_SECTION_TYPES.SLIDER]: { elementType: PAGE_ELEMENT_TYPES.SLIDE, min: 1, max: 10 },
  [PAGE_SECTION_TYPES.BANNER]: { elementType: PAGE_ELEMENT_TYPES.BANNER, min: 1, max: 1 },
  [PAGE_SECTION_TYPES.TEXT]: { elementType: PAGE_ELEMENT_TYPES.RICH_TEXT, min: 1, max: 6 },
  [PAGE_SECTION_TYPES.CARDS]: { elementType: PAGE_ELEMENT_TYPES.CARD, min: 1, max: 12 },
  [PAGE_SECTION_TYPES.TABS]: { elementType: PAGE_ELEMENT_TYPES.TAB, min: 2, max: 10 },
  [PAGE_SECTION_TYPES.ACCORDION]: { elementType: PAGE_ELEMENT_TYPES.ACCORDION_ITEM, min: 1, max: 20 },
  [PAGE_SECTION_TYPES.FAQ]: { elementType: PAGE_ELEMENT_TYPES.ACCORDION_ITEM, min: 1, max: 30 },
  [PAGE_SECTION_TYPES.CAROUSEL]: { elementType: PAGE_ELEMENT_TYPES.CAROUSEL_ITEM, min: 2, max: 20 },
  [PAGE_SECTION_TYPES.IMAGE]: { elementType: PAGE_ELEMENT_TYPES.IMAGE, min: 1, max: 1 },
  [PAGE_SECTION_TYPES.PRICING]: { elementType: PAGE_ELEMENT_TYPES.PRICING_PLAN, min: 1, max: 6 },
  [PAGE_SECTION_TYPES.STEPS]: { elementType: PAGE_ELEMENT_TYPES.STEP, min: 2, max: 10 },
  [PAGE_SECTION_TYPES.TEAM]: { elementType: PAGE_ELEMENT_TYPES.TEAM_MEMBER, min: 1, max: 24 },
  [PAGE_SECTION_TYPES.QUOTATION]: { elementType: PAGE_ELEMENT_TYPES.TESTIMONIAL_ITEM, min: 1, max: 10 },
  [PAGE_SECTION_TYPES.TESTIMONIAL]: { elementType: PAGE_ELEMENT_TYPES.TESTIMONIAL_ITEM, min: 1, max: 10 },
  [PAGE_SECTION_TYPES.REVIEW]: { elementType: PAGE_ELEMENT_TYPES.TESTIMONIAL_ITEM, min: 1, max: 10 },
  [PAGE_SECTION_TYPES.VIDEO]: { elementType: PAGE_ELEMENT_TYPES.VIDEO_EMBED, min: 1, max: 4 },
  [PAGE_SECTION_TYPES.CHART]: { elementType: PAGE_ELEMENT_TYPES.CHART_DATA, min: 1, max: 1 },
  [PAGE_SECTION_TYPES.GALLERY]: { elementType: PAGE_ELEMENT_TYPES.GALLERY_ITEM, min: 1, max: 30 },
  [PAGE_SECTION_TYPES.CTA]: { elementType: PAGE_ELEMENT_TYPES.CTA, min: 1, max: 1 },
  [PAGE_SECTION_TYPES.STATISTICS]: { elementType: PAGE_ELEMENT_TYPES.STAT_ITEM, min: 2, max: 12 },
  [PAGE_SECTION_TYPES.TIMELINE]: { elementType: PAGE_ELEMENT_TYPES.TIMELINE_ITEM, min: 2, max: 20 },
  [PAGE_SECTION_TYPES.MAP]: { elementType: PAGE_ELEMENT_TYPES.MAP, min: 1, max: 1 },
  [PAGE_SECTION_TYPES.PORTFOLIO]: { elementType: PAGE_ELEMENT_TYPES.PORTFOLIO_ITEM, min: 1, max: 24 },
})

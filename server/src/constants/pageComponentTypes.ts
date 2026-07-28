import { PAGE_ELEMENT_TYPES } from './pageElementTypes.js'

// What used to be a page "section type" is now a component type: a section
// is a generic, empty container (see page/Section.js) that holds an ordered
// list of these — so a single section can now mix, say, a Hero Slider and a
// Cards block, instead of a section being pinned to exactly one of these.
export const PAGE_COMPONENT_TYPES = Object.freeze({
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
  FEATURE: 'feature',
  // Primitive, single-element components — a heading, a spotlight image, or
  // a standalone link, for filling gaps the composite components above
  // don't cover without reaching for a whole Text/CTA block.
  HEADING: 'heading',
  LINK: 'link',
} as const)

export type PageComponentType = (typeof PAGE_COMPONENT_TYPES)[keyof typeof PAGE_COMPONENT_TYPES]

export const PAGE_COMPONENT_TYPE_VALUES = Object.values(PAGE_COMPONENT_TYPES)

// Unlike Content's SECTION_LAYOUTS (fixed multi-slot layouts, e.g. exactly one
// text + one image), every page component here is a homogeneous, *variable*-length
// list of one element type — a hero has 1-10 slides, a team component has 1-24
// members, and so on. So the rule per type is just { elementType, min, max),
// not Content's ordered `slots` array. This is the single source of truth the
// admin editor and pageController's validatePageSections() both read.
export const PAGE_COMPONENT_LAYOUTS = Object.freeze({
  [PAGE_COMPONENT_TYPES.SLIDER]: { elementType: PAGE_ELEMENT_TYPES.SLIDE, min: 1, max: 10 },
  [PAGE_COMPONENT_TYPES.BANNER]: { elementType: PAGE_ELEMENT_TYPES.BANNER, min: 1, max: 1 },
  [PAGE_COMPONENT_TYPES.TEXT]: { elementType: PAGE_ELEMENT_TYPES.RICH_TEXT, min: 1, max: 6 },
  [PAGE_COMPONENT_TYPES.CARDS]: { elementType: PAGE_ELEMENT_TYPES.CARD, min: 1, max: 12 },
  [PAGE_COMPONENT_TYPES.TABS]: { elementType: PAGE_ELEMENT_TYPES.TAB, min: 2, max: 10 },
  [PAGE_COMPONENT_TYPES.ACCORDION]: { elementType: PAGE_ELEMENT_TYPES.ACCORDION_ITEM, min: 1, max: 20 },
  [PAGE_COMPONENT_TYPES.FAQ]: { elementType: PAGE_ELEMENT_TYPES.ACCORDION_ITEM, min: 1, max: 30 },
  [PAGE_COMPONENT_TYPES.CAROUSEL]: { elementType: PAGE_ELEMENT_TYPES.CAROUSEL_ITEM, min: 2, max: 20 },
  [PAGE_COMPONENT_TYPES.IMAGE]: { elementType: PAGE_ELEMENT_TYPES.IMAGE, min: 1, max: 1 },
  [PAGE_COMPONENT_TYPES.PRICING]: { elementType: PAGE_ELEMENT_TYPES.PRICING_PLAN, min: 1, max: 6 },
  [PAGE_COMPONENT_TYPES.STEPS]: { elementType: PAGE_ELEMENT_TYPES.STEP, min: 2, max: 10 },
  [PAGE_COMPONENT_TYPES.TEAM]: { elementType: PAGE_ELEMENT_TYPES.TEAM_MEMBER, min: 1, max: 24 },
  [PAGE_COMPONENT_TYPES.QUOTATION]: { elementType: PAGE_ELEMENT_TYPES.TESTIMONIAL_ITEM, min: 1, max: 10 },
  [PAGE_COMPONENT_TYPES.TESTIMONIAL]: { elementType: PAGE_ELEMENT_TYPES.TESTIMONIAL_ITEM, min: 1, max: 10 },
  [PAGE_COMPONENT_TYPES.REVIEW]: { elementType: PAGE_ELEMENT_TYPES.TESTIMONIAL_ITEM, min: 1, max: 10 },
  [PAGE_COMPONENT_TYPES.VIDEO]: { elementType: PAGE_ELEMENT_TYPES.VIDEO_EMBED, min: 1, max: 4 },
  [PAGE_COMPONENT_TYPES.CHART]: { elementType: PAGE_ELEMENT_TYPES.CHART_DATA, min: 1, max: 1 },
  [PAGE_COMPONENT_TYPES.GALLERY]: { elementType: PAGE_ELEMENT_TYPES.GALLERY_ITEM, min: 1, max: 50 },
  [PAGE_COMPONENT_TYPES.CTA]: { elementType: PAGE_ELEMENT_TYPES.CTA, min: 1, max: 1 },
  [PAGE_COMPONENT_TYPES.STATISTICS]: { elementType: PAGE_ELEMENT_TYPES.STAT_ITEM, min: 2, max: 12 },
  [PAGE_COMPONENT_TYPES.TIMELINE]: { elementType: PAGE_ELEMENT_TYPES.TIMELINE_ITEM, min: 2, max: 20 },
  [PAGE_COMPONENT_TYPES.MAP]: { elementType: PAGE_ELEMENT_TYPES.MAP, min: 1, max: 1 },
  [PAGE_COMPONENT_TYPES.PORTFOLIO]: { elementType: PAGE_ELEMENT_TYPES.PORTFOLIO_ITEM, min: 1, max: 24 },
  [PAGE_COMPONENT_TYPES.FEATURE]: { elementType: PAGE_ELEMENT_TYPES.FEATURE, min: 1, max: 1 },
  [PAGE_COMPONENT_TYPES.HEADING]: { elementType: PAGE_ELEMENT_TYPES.HEADING, min: 1, max: 1 },
  [PAGE_COMPONENT_TYPES.LINK]: { elementType: PAGE_ELEMENT_TYPES.LINK, min: 1, max: 1 },
} as const)

// A section may hold at most this many components — same defensive-cap
// convention as pageController's 40-sections-per-page limit.
export const MAX_COMPONENTS_PER_SECTION = 30

// Leaf item types used inside a page section's `elements` array (see
// models/page/Section.js). Mirrors constants/elementTypes.js in spirit, but
// this is a separate catalog: page sections are page-*layout* building blocks
// (hero slides, pricing tiers, team members, ...), not article-body content.
// Only richText/image/videoEmbed are reused from content/Elements.js —
// paragraph/heading aren't, since the Text section's rich text editor already
// authors headings and formatting within one HTML block; a separate
// heading/paragraph element would just duplicate what richText already does.
export const PAGE_ELEMENT_TYPES = Object.freeze({
  RICH_TEXT: 'richText',
  IMAGE: 'image',
  VIDEO_EMBED: 'videoEmbed',
  // Page-specific.
  SLIDE: 'slide',
  BANNER: 'banner',
  CARD: 'card',
  TAB: 'tab',
  ACCORDION_ITEM: 'accordionItem',
  CAROUSEL_ITEM: 'carouselItem',
  PRICING_PLAN: 'pricingPlan',
  STEP: 'step',
  TEAM_MEMBER: 'teamMember',
  TESTIMONIAL_ITEM: 'testimonialItem',
  CHART_DATA: 'chartData',
  GALLERY_ITEM: 'galleryItem',
  CTA: 'cta',
  STAT_ITEM: 'statItem',
  TIMELINE_ITEM: 'timelineItem',
  MAP: 'map',
  PORTFOLIO_ITEM: 'portfolioItem',
  FEATURE: 'feature',
  // Primitive building blocks — same shape as content/Elements.js's heading
  // and link, reused directly rather than redefined (see page/Elements.js).
  HEADING: 'heading',
  LINK: 'link',
})

export const PAGE_ELEMENT_TYPE_VALUES = Object.values(PAGE_ELEMENT_TYPES)

export const CHART_TYPES = Object.freeze(['bar', 'line', 'pie', 'doughnut'])

export const SOCIAL_PLATFORMS = Object.freeze([
  'linkedin', 'twitter', 'instagram', 'facebook', 'website', 'email',
])

// A Media Gallery item can be an image, a video (embed URL, same as the
// Video section), or a downloadable document — one unified grid rather than
// three separate section types, since editors think of these as "one gallery
// with mixed media," not three different components to choose between.
export const GALLERY_MEDIA_TYPES = Object.freeze(['image', 'video', 'document'])

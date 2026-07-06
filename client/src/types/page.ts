import type { LangKey } from './content'

export type PageStatus = 'draft' | 'published'

export type PageMetadata = {
  keywords: string[]
  author: string
  description: string
}

export type PageDetail = {
  _id: string
  page: string
  application: string
  langKey: LangKey
  title: string
  slug: string
  status: PageStatus
  metadata: PageMetadata
  sections: PageSection[]
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export type PageItem = {
  _id: string
  application: string
  isHomepage: boolean
  createdAt: string
  updatedAt: string
  details: PageDetail[]
}

// --- Section/element catalog ---
// Mirrors server/src/constants/pageSectionTypes.js and
// server/src/constants/pageElementTypes.js — kept in sync by hand, same
// existing precedent as content.ts's SECTION_LAYOUTS (no shared package
// between client/server in this repo).

export type PageSectionType =
  | 'slider' | 'banner' | 'text' | 'cards' | 'tabs' | 'accordion' | 'faq'
  | 'carousel' | 'image' | 'pricing' | 'steps' | 'team'
  | 'quotation' | 'testimonial' | 'review' | 'video' | 'chart'
  | 'gallery' | 'cta' | 'statistics' | 'timeline' | 'map' | 'portfolio'

export const PAGE_SECTION_TYPE_VALUES: PageSectionType[] = [
  'slider', 'banner', 'text', 'cards', 'tabs', 'accordion', 'faq',
  'carousel', 'image', 'pricing', 'steps', 'team',
  'quotation', 'testimonial', 'review', 'video', 'chart',
  'gallery', 'cta', 'statistics', 'timeline', 'map', 'portfolio',
]

export const PAGE_SECTION_TYPE_LABELS: Record<PageSectionType, string> = {
  slider: 'Hero Slider',
  banner: 'Banner',
  text: 'Text Section',
  cards: 'Cards',
  tabs: 'Tabs',
  accordion: 'Accordion',
  faq: 'Frequently Asked Questions',
  carousel: 'Carousel',
  image: 'Image',
  pricing: 'Pricing',
  steps: 'Steps',
  team: 'Team',
  quotation: 'Quotation',
  testimonial: 'Testimonial',
  review: 'Review',
  video: 'Video Embed',
  chart: 'Chart',
  gallery: 'Media Gallery',
  cta: 'Call to Action',
  statistics: 'Statistics',
  timeline: 'Timeline',
  map: 'Map',
  portfolio: 'Portfolio',
}

// A short line shown under each option in the section picker, so an editor
// can tell "Quotation" apart from "Testimonial" and "Review" at a glance even
// though the three share one underlying element shape (see PageElement below).
export const PAGE_SECTION_TYPE_DESCRIPTIONS: Record<PageSectionType, string> = {
  slider: 'Full-width rotating hero slides with a heading and call to action.',
  banner: 'One static promo block with an image, heading, and call to action.',
  text: 'One or more rich text blocks — for prose, announcements, policies.',
  cards: 'A grid of image + title + description cards, each linking out.',
  tabs: 'Switchable panels of rich text content under a row of labels.',
  accordion: 'A list of expandable heading + content items.',
  faq: 'An accordion framed as questions and answers.',
  carousel: 'A horizontally scrollable row of images or promo tiles.',
  image: 'A single spotlight image.',
  pricing: 'Side-by-side pricing tiers with features and a call to action.',
  steps: 'A numbered sequence, e.g. "How it works".',
  team: 'A showcase of team members with photo, name, and role.',
  quotation: 'One or more standalone quotes with attribution.',
  testimonial: 'Customer testimonials with attribution.',
  review: 'Customer reviews with attribution and a star rating.',
  video: 'One or more embedded videos.',
  chart: 'A bar, line, pie, or doughnut chart.',
  gallery: 'A grid of images, videos, and downloadable documents.',
  cta: 'A text-led prompt with one or two buttons — signups, promotions.',
  statistics: 'A row of KPIs or counters, e.g. "500+ clients".',
  timeline: 'A dated sequence of events, e.g. company history.',
  map: 'An embedded location map for a contact or visit-us page.',
  portfolio: 'A grid of projects or case studies with client and category.',
}

export type ChartType = 'bar' | 'line' | 'pie' | 'doughnut'

export const CHART_TYPE_VALUES: ChartType[] = ['bar', 'line', 'pie', 'doughnut']

export const CHART_TYPE_LABELS: Record<ChartType, string> = {
  bar: 'Bar',
  line: 'Line',
  pie: 'Pie',
  doughnut: 'Doughnut',
}

export type SocialPlatform = 'linkedin' | 'twitter' | 'instagram' | 'facebook' | 'website' | 'email'

export const SOCIAL_PLATFORM_VALUES: SocialPlatform[] = [
  'linkedin', 'twitter', 'instagram', 'facebook', 'website', 'email',
]

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  linkedin: 'LinkedIn',
  twitter: 'X / Twitter',
  instagram: 'Instagram',
  facebook: 'Facebook',
  website: 'Website',
  email: 'Email',
}

export type PageElementType =
  | 'richText' | 'image' | 'videoEmbed'
  | 'slide' | 'banner' | 'card' | 'tab' | 'accordionItem' | 'carouselItem'
  | 'pricingPlan' | 'step' | 'teamMember' | 'testimonialItem' | 'chartData'
  | 'galleryItem' | 'cta' | 'statItem' | 'timelineItem' | 'map' | 'portfolioItem'

export const PAGE_ELEMENT_TYPE_LABELS: Record<PageElementType, string> = {
  richText: 'Text Block',
  image: 'Image',
  videoEmbed: 'Video',
  slide: 'Slide',
  banner: 'Banner',
  card: 'Card',
  tab: 'Tab',
  accordionItem: 'Item',
  carouselItem: 'Item',
  pricingPlan: 'Plan',
  step: 'Step',
  teamMember: 'Team Member',
  testimonialItem: 'Quote',
  chartData: 'Chart',
  galleryItem: 'Item',
  cta: 'Call to Action',
  statItem: 'Stat',
  timelineItem: 'Event',
  map: 'Map',
  portfolioItem: 'Project',
}

export type GalleryMediaType = 'image' | 'video' | 'document'

export const GALLERY_MEDIA_TYPE_VALUES: GalleryMediaType[] = ['image', 'video', 'document']

export const GALLERY_MEDIA_TYPE_LABELS: Record<GalleryMediaType, string> = {
  image: 'Image',
  video: 'Video',
  document: 'Document',
}

export type SectionSpacing = 'compact' | 'normal' | 'spacious'
export type SectionWidth = 'contained' | 'full'
export type SectionTextAlign = 'left' | 'center' | 'right'

export const SECTION_SPACING_VALUES: SectionSpacing[] = ['compact', 'normal', 'spacious']
export const SECTION_WIDTH_VALUES: SectionWidth[] = ['contained', 'full']
export const SECTION_TEXT_ALIGN_VALUES: SectionTextAlign[] = ['left', 'center', 'right']

export const SECTION_SPACING_LABELS: Record<SectionSpacing, string> = {
  compact: 'Compact',
  normal: 'Normal',
  spacious: 'Spacious',
}
export const SECTION_WIDTH_LABELS: Record<SectionWidth, string> = {
  contained: 'Contained',
  full: 'Full width',
}

// Presentational settings shared by every section type, regardless of which
// element type it holds — mirrors server/src/models/page/Section.js's
// sectionSettingsSchema exactly.
export type SectionSettings = {
  backgroundColor: string
  spacing: SectionSpacing
  width: SectionWidth
  textAlign: SectionTextAlign
}

export const DEFAULT_SECTION_SETTINGS: SectionSettings = {
  backgroundColor: '',
  spacing: 'normal',
  width: 'contained',
  textAlign: 'left',
}

// Element shapes ------------------------------------------------------------

export type RichTextElement = { _id?: string; elementType: 'richText'; html: string }
export type ImageElement = { _id?: string; elementType: 'image'; url: string; alt: string; caption: string }
export type VideoEmbedElement = { _id?: string; elementType: 'videoEmbed'; url: string; caption: string }

export type SlideElement = {
  _id?: string; elementType: 'slide'
  image: string; imageAlt: string; heading: string; subheading: string; ctaLabel: string; ctaUrl: string
}
export type BannerElement = {
  _id?: string; elementType: 'banner'
  image: string; imageAlt: string; heading: string; subheading: string; ctaLabel: string; ctaUrl: string
}
export type CardElement = {
  _id?: string; elementType: 'card'
  image: string; imageAlt: string; title: string; description: string; badge: string; ctaLabel: string; ctaUrl: string
}
export type TabElement = { _id?: string; elementType: 'tab'; label: string; content: string }
export type AccordionItemElement = { _id?: string; elementType: 'accordionItem'; heading: string; content: string }
export type CarouselItemElement = {
  _id?: string; elementType: 'carouselItem'
  image: string; imageAlt: string; caption: string; linkUrl: string
}
export type PricingPlanElement = {
  _id?: string; elementType: 'pricingPlan'
  name: string; price: string; billingPeriod: string; features: string[]
  ctaLabel: string; ctaUrl: string; highlighted: boolean
}
export type StepElement = { _id?: string; elementType: 'step'; title: string; description: string; icon: string }
export type SocialLink = { platform: SocialPlatform; url: string }
export type TeamMemberElement = {
  _id?: string; elementType: 'teamMember'
  photo: string; name: string; role: string; bio: string; socialLinks: SocialLink[]
}
export type TestimonialItemElement = {
  _id?: string; elementType: 'testimonialItem'
  quote: string; authorName: string; authorRole: string; avatar: string; rating: number | null
}
export type ChartSeries = { label: string; color: string; data: number[] }
export type ChartDataElement = {
  _id?: string; elementType: 'chartData'
  chartType: ChartType; title: string; labels: string[]; series: ChartSeries[]
}

export type GalleryItemElement = {
  _id?: string; elementType: 'galleryItem'
  mediaType: GalleryMediaType; url: string; thumbnailUrl: string; alt: string; caption: string; fileName: string
}
export type CtaElement = {
  _id?: string; elementType: 'cta'
  heading: string; subheading: string; ctaLabel: string; ctaUrl: string
  secondaryCtaLabel: string; secondaryCtaUrl: string
}
export type StatItemElement = { _id?: string; elementType: 'statItem'; value: string; label: string; icon: string }
export type TimelineItemElement = {
  _id?: string; elementType: 'timelineItem'; date: string; title: string; description: string
}
export type MapElement = {
  _id?: string; elementType: 'map'
  address: string; latitude: number | null; longitude: number | null; zoom: number; embedUrl: string
}
export type PortfolioItemElement = {
  _id?: string; elementType: 'portfolioItem'
  image: string; imageAlt: string; title: string; client: string; category: string
  description: string; caseStudyUrl: string
}

export type PageElement =
  | RichTextElement | ImageElement | VideoEmbedElement
  | SlideElement | BannerElement | CardElement | TabElement | AccordionItemElement | CarouselItemElement
  | PricingPlanElement | StepElement | TeamMemberElement | TestimonialItemElement | ChartDataElement
  | GalleryItemElement | CtaElement | StatItemElement | TimelineItemElement | MapElement | PortfolioItemElement

export type PageSection = {
  _id?: string
  // Client-only stable key for React/dnd-kit lists — same convention as
  // ContentSection.cid in content.ts; stripped before saving.
  cid?: string
  type: PageSectionType
  // Lets an editor keep a section authored but temporarily out of the
  // rendered page, without deleting its content — mirrors Section.isVisible.
  isVisible: boolean
  settings: SectionSettings
  elements: PageElement[]
}

// Single source of truth for which element type a section holds and how many
// are allowed — mirrors server/src/constants/pageSectionTypes.js exactly.
export const PAGE_SECTION_LAYOUTS: Record<PageSectionType, { elementType: PageElementType; min: number; max: number }> = {
  slider: { elementType: 'slide', min: 1, max: 10 },
  banner: { elementType: 'banner', min: 1, max: 1 },
  text: { elementType: 'richText', min: 1, max: 6 },
  cards: { elementType: 'card', min: 1, max: 12 },
  tabs: { elementType: 'tab', min: 2, max: 10 },
  accordion: { elementType: 'accordionItem', min: 1, max: 20 },
  faq: { elementType: 'accordionItem', min: 1, max: 30 },
  carousel: { elementType: 'carouselItem', min: 2, max: 20 },
  image: { elementType: 'image', min: 1, max: 1 },
  pricing: { elementType: 'pricingPlan', min: 1, max: 6 },
  steps: { elementType: 'step', min: 2, max: 10 },
  team: { elementType: 'teamMember', min: 1, max: 24 },
  quotation: { elementType: 'testimonialItem', min: 1, max: 10 },
  testimonial: { elementType: 'testimonialItem', min: 1, max: 10 },
  review: { elementType: 'testimonialItem', min: 1, max: 10 },
  video: { elementType: 'videoEmbed', min: 1, max: 4 },
  chart: { elementType: 'chartData', min: 1, max: 1 },
  gallery: { elementType: 'galleryItem', min: 1, max: 30 },
  cta: { elementType: 'cta', min: 1, max: 1 },
  statistics: { elementType: 'statItem', min: 2, max: 12 },
  timeline: { elementType: 'timelineItem', min: 2, max: 20 },
  map: { elementType: 'map', min: 1, max: 1 },
  portfolio: { elementType: 'portfolioItem', min: 1, max: 24 },
}

export function createEmptyElementOfType(elementType: PageElementType): PageElement {
  switch (elementType) {
    case 'richText': return { elementType, html: '' }
    case 'image': return { elementType, url: '', alt: '', caption: '' }
    case 'videoEmbed': return { elementType, url: '', caption: '' }
    case 'slide': return { elementType, image: '', imageAlt: '', heading: '', subheading: '', ctaLabel: '', ctaUrl: '' }
    case 'banner': return { elementType, image: '', imageAlt: '', heading: '', subheading: '', ctaLabel: '', ctaUrl: '' }
    case 'card': return { elementType, image: '', imageAlt: '', title: '', description: '', badge: '', ctaLabel: '', ctaUrl: '' }
    case 'tab': return { elementType, label: '', content: '' }
    case 'accordionItem': return { elementType, heading: '', content: '' }
    case 'carouselItem': return { elementType, image: '', imageAlt: '', caption: '', linkUrl: '' }
    case 'pricingPlan': return { elementType, name: '', price: '', billingPeriod: '', features: [], ctaLabel: '', ctaUrl: '', highlighted: false }
    case 'step': return { elementType, title: '', description: '', icon: '' }
    case 'teamMember': return { elementType, photo: '', name: '', role: '', bio: '', socialLinks: [] }
    case 'testimonialItem': return { elementType, quote: '', authorName: '', authorRole: '', avatar: '', rating: null }
    case 'chartData': return { elementType, chartType: 'bar', title: '', labels: [], series: [] }
    case 'galleryItem': return { elementType, mediaType: 'image', url: '', thumbnailUrl: '', alt: '', caption: '', fileName: '' }
    case 'cta': return { elementType, heading: '', subheading: '', ctaLabel: '', ctaUrl: '', secondaryCtaLabel: '', secondaryCtaUrl: '' }
    case 'statItem': return { elementType, value: '', label: '', icon: '' }
    case 'timelineItem': return { elementType, date: '', title: '', description: '' }
    case 'map': return { elementType, address: '', latitude: null, longitude: null, zoom: 14, embedUrl: '' }
    case 'portfolioItem': return { elementType, image: '', imageAlt: '', title: '', client: '', category: '', description: '', caseStudyUrl: '' }
  }
}

// Seeds a new section with its type's minimum element count — e.g. "Steps"
// starts with 2 empty steps (its min), "Banner" with exactly 1.
export function createEmptySection(type: PageSectionType): PageSection {
  const layout = PAGE_SECTION_LAYOUTS[type]
  const elements = Array.from({ length: layout.min }, () => createEmptyElementOfType(layout.elementType))
  return { cid: crypto.randomUUID(), type, isVisible: true, settings: { ...DEFAULT_SECTION_SETTINGS }, elements }
}

// Assigns a stable client key to sections loaded from the server (which only
// carry a real `_id`), so freshly-loaded and freshly-created sections can
// share one dnd-kit/React key scheme. Mirrors content.ts's withClientKeys.
export function withClientKeys(sections: PageSection[]): PageSection[] {
  return sections.map((s) => ({ ...s, cid: s.cid ?? s._id ?? crypto.randomUUID() }))
}

// Strips the client-only `cid` before sending sections to the API.
export function toPersistableSections(sections: PageSection[]): PageSection[] {
  return sections.map(({ cid: _cid, ...rest }) => rest)
}

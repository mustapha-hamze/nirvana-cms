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

// --- Section/component/element catalog ---
// Mirrors server/src/constants/pageComponentTypes.js and
// server/src/constants/pageElementTypes.js. The runtime catalogs (labels,
// layouts, descriptions, factories) live in constants/pageSections.ts and
// factories/pageElements.ts — this file only declares the shapes.

// What used to be a page "section type" is now a component type: a section
// is a generic, empty container (see PageSection below) that holds an
// ordered list of these — so a single section can mix, say, a Hero Slider
// and a Cards block, instead of a section being pinned to exactly one type.
export type PageComponentType =
  | 'slider' | 'banner' | 'text' | 'cards' | 'tabs' | 'accordion' | 'faq'
  | 'carousel' | 'image' | 'pricing' | 'steps' | 'team'
  | 'quotation' | 'testimonial' | 'review' | 'video' | 'chart'
  | 'gallery' | 'cta' | 'statistics' | 'timeline' | 'map' | 'portfolio' | 'feature'
  // Primitive, single-element components.
  | 'heading' | 'link'

export type ChartType = 'bar' | 'line' | 'pie' | 'doughnut'

export type SocialPlatform = 'linkedin' | 'twitter' | 'instagram' | 'facebook' | 'website' | 'email'

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export type PageElementType =
  | 'richText' | 'image' | 'videoEmbed'
  | 'slide' | 'banner' | 'card' | 'tab' | 'accordionItem' | 'carouselItem'
  | 'pricingPlan' | 'step' | 'teamMember' | 'testimonialItem' | 'chartData'
  | 'galleryItem' | 'cta' | 'statItem' | 'timelineItem' | 'map' | 'portfolioItem' | 'feature'
  | 'heading' | 'link'

export type GalleryMediaType = 'image' | 'video' | 'document'

export type SectionSpacing = 'compact' | 'normal' | 'spacious'
export type SectionWidth = 'contained' | 'full'
export type SectionTextAlign = 'left' | 'center' | 'right'

// Presentational settings shared by every section type, regardless of which
// element type it holds — mirrors server/src/models/page/Section.js's
// sectionSettingsSchema exactly.
export type SectionSettings = {
  backgroundColor: string
  spacing: SectionSpacing
  width: SectionWidth
  textAlign: SectionTextAlign
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
  image: string; imageAlt: string
  logo: string; logoAlt: string
  heading: string; subheading: string; ctaLabel: string; ctaUrl: string
}
export type CardElement = {
  _id?: string; elementType: 'card'
  image: string; imageAlt: string; title: string; description: string; badge: string; ctaLabel: string; ctaUrl: string
  highlighted: boolean
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

export type FeatureElement = {
  _id?: string; elementType: 'feature'
  image: string; imageAlt: string
  heading: string; highlightText: string; description: string
  items: string[]
  badgeImage: string; badgeImageAlt: string
}

// Primitives — same shape as the equivalent content body elements
// (types/content.ts), declared fresh here rather than imported since every
// other page element already follows that same parallel-not-shared
// convention (see RichTextElement/ImageElement/VideoEmbedElement above).
export type HeadingElement = { _id?: string; elementType: 'heading'; level: HeadingLevel; text: string }
export type LinkElement = { _id?: string; elementType: 'link'; url: string; label: string; newTab: boolean }

export type PageElement =
  | RichTextElement | ImageElement | VideoEmbedElement
  | SlideElement | BannerElement | CardElement | TabElement | AccordionItemElement | CarouselItemElement
  | PricingPlanElement | StepElement | TeamMemberElement | TestimonialItemElement | ChartDataElement
  | GalleryItemElement | CtaElement | StatItemElement | TimelineItemElement | MapElement | PortfolioItemElement
  | FeatureElement | HeadingElement | LinkElement

// One component placed inside a section — what used to be an entire
// section's `type` + `elements` before sections became generic containers.
export type PageComponent = {
  _id?: string
  // Client-only stable key for React/dnd-kit lists, same convention as
  // PageSection.cid below — stripped before saving.
  cid?: string
  type: PageComponentType
  elements: PageElement[]
}

export type PageSection = {
  _id?: string
  // Client-only stable key for React/dnd-kit lists — same convention as
  // ContentSection.cid in content.ts; stripped before saving.
  cid?: string
  // Admin-facing label, e.g. "About Us" — language-specific since sections
  // live under PageDetails.
  title: string
  // Lets an editor keep a section authored but temporarily out of the
  // rendered page, without deleting its content — mirrors Section.isVisible.
  isVisible: boolean
  settings: SectionSettings
  // A section is a generic container an editor fills with one or more
  // components — it carries no type of its own. May be empty: a freshly
  // added section starts blank until components are added to it.
  components: PageComponent[]
}

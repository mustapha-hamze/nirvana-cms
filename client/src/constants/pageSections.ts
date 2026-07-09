// Page component/element catalog — mirrors server/src/constants/pageComponentTypes.js
// and server/src/constants/pageElementTypes.js. Split out of types/page.ts so
// that module holds only type declarations; this one holds the runtime
// catalogs consumed by the section/component/element editors and pickers.
import type { ChartType, GalleryMediaType, HeadingLevel, PageComponentType, PageElementType, SectionSettings, SectionSpacing, SectionTextAlign, SectionWidth, SocialPlatform } from "../types/page";

export const PAGE_COMPONENT_TYPE_VALUES: PageComponentType[] = [
  "slider", "banner", "text", "cards", "tabs", "accordion", "faq",
  "carousel", "image", "pricing", "steps", "team",
  "quotation", "testimonial", "review", "video", "chart",
  "gallery", "cta", "statistics", "timeline", "map", "portfolio", "feature",
  "heading", "link",
];

export const PAGE_COMPONENT_TYPE_LABELS: Record<PageComponentType, string> = {
  slider: "Hero Slider",
  banner: "Banner",
  text: "Text Section",
  cards: "Cards",
  tabs: "Tabs",
  accordion: "Accordion",
  faq: "Frequently Asked Questions",
  carousel: "Carousel",
  image: "Image",
  pricing: "Pricing",
  steps: "Steps",
  team: "Team",
  quotation: "Quotation",
  testimonial: "Testimonial",
  review: "Review",
  video: "Video Embed",
  chart: "Chart",
  gallery: "Media Gallery",
  cta: "Call to Action",
  statistics: "Statistics",
  timeline: "Timeline",
  map: "Map",
  portfolio: "Portfolio",
  feature: "Feature",
  heading: "Heading",
  link: "Link",
};

// A short line shown under each option in the component picker, so an editor
// can tell "Quotation" apart from "Testimonial" and "Review" at a glance even
// though the three share one underlying element shape (see PageElement).
export const PAGE_COMPONENT_TYPE_DESCRIPTIONS: Record<PageComponentType, string> = {
  slider: "Full-width rotating hero slides with a heading and call to action.",
  banner: "One static promo block with a background image, optional logo, heading, and call to action.",
  text: "One or more rich text blocks — for prose, announcements, policies.",
  cards: "A grid of image + title + description cards, each linking out.",
  tabs: "Switchable panels of rich text content under a row of labels.",
  accordion: "A list of expandable heading + content items.",
  faq: "An accordion framed as questions and answers.",
  carousel: "A horizontally scrollable row of images or promo tiles.",
  image: "A single spotlight image.",
  pricing: "Side-by-side pricing tiers with features and a call to action.",
  steps: 'A numbered sequence, e.g. "How it works".',
  team: "A showcase of team members with photo, name, and role.",
  quotation: "One or more standalone quotes with attribution.",
  testimonial: "Customer testimonials with attribution.",
  review: "Customer reviews with attribution and a star rating.",
  video: "One or more embedded videos.",
  chart: "A bar, line, pie, or doughnut chart.",
  gallery: "A grid of images, videos, and downloadable documents.",
  cta: "A text-led prompt with one or two buttons — signups, promotions.",
  statistics: 'A row of KPIs or counters, e.g. "500+ clients".',
  timeline: "A dated sequence of events, e.g. company history.",
  map: "An embedded location map for a contact or visit-us page.",
  portfolio: "A grid of projects or case studies with client and category.",
  feature: "An image beside a heading, description, and checklist — e.g. an \"about us\" or \"why choose us\" block, with an optional badge graphic.",
  heading: "A standalone heading, H1 through H6.",
  link: "A standalone link or button.",
};

export const CHART_TYPE_VALUES: ChartType[] = ["bar", "line", "pie", "doughnut"];

export const CHART_TYPE_LABELS: Record<ChartType, string> = {
  bar: "Bar",
  line: "Line",
  pie: "Pie",
  doughnut: "Doughnut",
};

export const SOCIAL_PLATFORM_VALUES: SocialPlatform[] = ["linkedin", "twitter", "instagram", "facebook", "website", "email"];

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  linkedin: "LinkedIn",
  twitter: "X / Twitter",
  instagram: "Instagram",
  facebook: "Facebook",
  website: "Website",
  email: "Email",
};

export const HEADING_LEVELS: HeadingLevel[] = [1, 2, 3, 4, 5, 6];

export const PAGE_ELEMENT_TYPE_LABELS: Record<PageElementType, string> = {
  richText: "Text Block",
  image: "Image",
  videoEmbed: "Video",
  slide: "Slide",
  banner: "Banner",
  card: "Card",
  tab: "Tab",
  accordionItem: "Item",
  carouselItem: "Item",
  pricingPlan: "Plan",
  step: "Step",
  teamMember: "Team Member",
  testimonialItem: "Quote",
  chartData: "Chart",
  galleryItem: "Item",
  cta: "Call to Action",
  statItem: "Stat",
  timelineItem: "Event",
  map: "Map",
  portfolioItem: "Project",
  feature: "Feature",
  heading: "Heading",
  link: "Link",
};

export const GALLERY_MEDIA_TYPE_VALUES: GalleryMediaType[] = ["image", "video", "document"];

export const GALLERY_MEDIA_TYPE_LABELS: Record<GalleryMediaType, string> = {
  image: "Image",
  video: "Video",
  document: "Document",
};

export const SECTION_SPACING_VALUES: SectionSpacing[] = ["compact", "normal", "spacious"];
export const SECTION_WIDTH_VALUES: SectionWidth[] = ["contained", "full"];
export const SECTION_TEXT_ALIGN_VALUES: SectionTextAlign[] = ["left", "center", "right"];

export const SECTION_SPACING_LABELS: Record<SectionSpacing, string> = {
  compact: "Compact",
  normal: "Normal",
  spacious: "Spacious",
};
export const SECTION_WIDTH_LABELS: Record<SectionWidth, string> = {
  contained: "Contained",
  full: "Full width",
};

export const DEFAULT_SECTION_SETTINGS: SectionSettings = {
  backgroundColor: "",
  spacing: "normal",
  width: "contained",
  textAlign: "left",
};

// Single source of truth for which element type a component holds and how
// many are allowed — mirrors server/src/constants/pageComponentTypes.js exactly.
export const PAGE_COMPONENT_LAYOUTS: Record<PageComponentType, { elementType: PageElementType; min: number; max: number }> = {
  slider: { elementType: "slide", min: 1, max: 10 },
  banner: { elementType: "banner", min: 1, max: 1 },
  text: { elementType: "richText", min: 1, max: 6 },
  cards: { elementType: "card", min: 1, max: 12 },
  tabs: { elementType: "tab", min: 2, max: 10 },
  accordion: { elementType: "accordionItem", min: 1, max: 20 },
  faq: { elementType: "accordionItem", min: 1, max: 30 },
  carousel: { elementType: "carouselItem", min: 2, max: 20 },
  image: { elementType: "image", min: 1, max: 1 },
  pricing: { elementType: "pricingPlan", min: 1, max: 6 },
  steps: { elementType: "step", min: 2, max: 10 },
  team: { elementType: "teamMember", min: 1, max: 24 },
  quotation: { elementType: "testimonialItem", min: 1, max: 10 },
  testimonial: { elementType: "testimonialItem", min: 1, max: 10 },
  review: { elementType: "testimonialItem", min: 1, max: 10 },
  video: { elementType: "videoEmbed", min: 1, max: 4 },
  chart: { elementType: "chartData", min: 1, max: 1 },
  gallery: { elementType: "galleryItem", min: 1, max: 50 },
  cta: { elementType: "cta", min: 1, max: 1 },
  statistics: { elementType: "statItem", min: 2, max: 12 },
  timeline: { elementType: "timelineItem", min: 2, max: 20 },
  map: { elementType: "map", min: 1, max: 1 },
  portfolio: { elementType: "portfolioItem", min: 1, max: 24 },
  feature: { elementType: "feature", min: 1, max: 1 },
  heading: { elementType: "heading", min: 1, max: 1 },
  link: { elementType: "link", min: 1, max: 1 },
};

// A section may hold at most this many components — mirrors server's
// MAX_COMPONENTS_PER_SECTION (pageComponentTypes.js) exactly.
export const MAX_COMPONENTS_PER_SECTION = 30;

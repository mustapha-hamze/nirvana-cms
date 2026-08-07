// Page component/element catalog — mirrors server/src/constants/pageComponentTypes.js
// and server/src/constants/pageElementTypes.js. Split out of types/page.ts so
// that module holds only type declarations; this one holds the runtime
// catalogs consumed by the section/component/element editors and pickers.
import type { ChartType, GalleryMediaType, HeadingLevel, PageComponentType, PageElementType, SectionSettings, SectionSpacing, SectionTextAlign, SectionWidth, SocialPlatform } from "../types/page";
import type { TranslationKey } from "../i18n/types";

export const PAGE_COMPONENT_TYPE_VALUES: PageComponentType[] = [
  "slider", "banner", "text", "cards", "tabs", "accordion", "faq",
  "carousel", "image", "pricing", "steps", "team",
  "quotation", "testimonial", "review", "video", "chart",
  "gallery", "cta", "statistics", "timeline", "map", "portfolio", "feature",
  "heading", "link",
];

export const PAGE_COMPONENT_TYPE_KEYS: Record<PageComponentType, TranslationKey> = {
  slider: "pageBuilder.componentSlider",
  banner: "pageBuilder.componentBanner",
  text: "pageBuilder.componentText",
  cards: "pageBuilder.componentCards",
  tabs: "pageBuilder.componentTabs",
  accordion: "pageBuilder.componentAccordion",
  faq: "pageBuilder.componentFaq",
  carousel: "pageBuilder.componentCarousel",
  image: "pageBuilder.componentImage",
  pricing: "pageBuilder.componentPricing",
  steps: "pageBuilder.componentSteps",
  team: "pageBuilder.componentTeam",
  quotation: "pageBuilder.componentQuotation",
  testimonial: "pageBuilder.componentTestimonial",
  review: "pageBuilder.componentReview",
  video: "pageBuilder.componentVideo",
  chart: "pageBuilder.componentChart",
  gallery: "pageBuilder.componentGallery",
  cta: "pageBuilder.componentCta",
  statistics: "pageBuilder.componentStatistics",
  timeline: "pageBuilder.componentTimeline",
  map: "pageBuilder.componentMap",
  portfolio: "pageBuilder.componentPortfolio",
  feature: "pageBuilder.componentFeature",
  heading: "pageBuilder.componentHeading",
  link: "pageBuilder.componentLink",
};

// A short line shown under each option in the component picker, so an editor
// can tell "Quotation" apart from "Testimonial" and "Review" at a glance even
// though the three share one underlying element shape (see PageElement).
export const PAGE_COMPONENT_TYPE_DESCRIPTION_KEYS: Record<PageComponentType, TranslationKey> = {
  slider: "pageBuilder.descSlider",
  banner: "pageBuilder.descBanner",
  text: "pageBuilder.descText",
  cards: "pageBuilder.descCards",
  tabs: "pageBuilder.descTabs",
  accordion: "pageBuilder.descAccordion",
  faq: "pageBuilder.descFaq",
  carousel: "pageBuilder.descCarousel",
  image: "pageBuilder.descImage",
  pricing: "pageBuilder.descPricing",
  steps: "pageBuilder.descSteps",
  team: "pageBuilder.descTeam",
  quotation: "pageBuilder.descQuotation",
  testimonial: "pageBuilder.descTestimonial",
  review: "pageBuilder.descReview",
  video: "pageBuilder.descVideo",
  chart: "pageBuilder.descChart",
  gallery: "pageBuilder.descGallery",
  cta: "pageBuilder.descCta",
  statistics: "pageBuilder.descStatistics",
  timeline: "pageBuilder.descTimeline",
  map: "pageBuilder.descMap",
  portfolio: "pageBuilder.descPortfolio",
  feature: "pageBuilder.descFeature",
  heading: "pageBuilder.descHeading",
  link: "pageBuilder.descLink",
};

export const CHART_TYPE_VALUES: ChartType[] = ["bar", "line", "pie", "doughnut"];

export const CHART_TYPE_KEYS: Record<ChartType, TranslationKey> = {
  bar: "pageBuilder.chartBar",
  line: "pageBuilder.chartLine",
  pie: "pageBuilder.chartPie",
  doughnut: "pageBuilder.chartDoughnut",
};

export const SOCIAL_PLATFORM_VALUES: SocialPlatform[] = ["linkedin", "twitter", "instagram", "facebook", "website", "email"];

export const SOCIAL_PLATFORM_KEYS: Record<SocialPlatform, TranslationKey> = {
  linkedin: "pageBuilder.platformLinkedin",
  twitter: "pageBuilder.platformTwitter",
  instagram: "pageBuilder.platformInstagram",
  facebook: "pageBuilder.platformFacebook",
  website: "pageBuilder.platformWebsite",
  email: "pageBuilder.platformEmail",
};

export const HEADING_LEVELS: HeadingLevel[] = [1, 2, 3, 4, 5, 6];

export const PAGE_ELEMENT_TYPE_KEYS: Record<PageElementType, TranslationKey> = {
  richText: "pageBuilder.elementTextBlock",
  image: "contentBuilder.elementImage",
  videoEmbed: "contentBuilder.elementVideoEmbed",
  slide: "pageBuilder.elementSlide",
  banner: "pageBuilder.componentBanner",
  card: "pageBuilder.elementCard",
  tab: "pageBuilder.elementTab",
  accordionItem: "pageBuilder.elementItem",
  carouselItem: "pageBuilder.elementItem",
  pricingPlan: "pageBuilder.elementPlan",
  step: "pageBuilder.elementStep",
  teamMember: "pageBuilder.elementTeamMember",
  testimonialItem: "pageBuilder.elementQuote",
  chartData: "pageBuilder.componentChart",
  galleryItem: "pageBuilder.elementItem",
  cta: "pageBuilder.componentCta",
  statItem: "pageBuilder.elementStat",
  timelineItem: "pageBuilder.elementEvent",
  map: "pageBuilder.componentMap",
  portfolioItem: "pageBuilder.elementProject",
  feature: "pageBuilder.componentFeature",
  heading: "contentBuilder.elementHeading",
  link: "contentBuilder.elementLink",
};

export const GALLERY_MEDIA_TYPE_VALUES: GalleryMediaType[] = ["image", "video", "document"];

export const GALLERY_MEDIA_TYPE_KEYS: Record<GalleryMediaType, TranslationKey> = {
  image: "contentBuilder.elementImage",
  video: "contentBuilder.elementVideoEmbed",
  document: "pageBuilder.mediaDocument",
};

export const SECTION_SPACING_VALUES: SectionSpacing[] = ["compact", "normal", "spacious"];
export const SECTION_WIDTH_VALUES: SectionWidth[] = ["contained", "full"];
export const SECTION_TEXT_ALIGN_VALUES: SectionTextAlign[] = ["left", "center", "right"];

export const SECTION_SPACING_KEYS: Record<SectionSpacing, TranslationKey> = {
  compact: "pageBuilder.spacingCompact",
  normal: "pageBuilder.spacingNormal",
  spacious: "pageBuilder.spacingSpacious",
};
export const SECTION_WIDTH_KEYS: Record<SectionWidth, TranslationKey> = {
  contained: "pageBuilder.widthContained",
  full: "pageBuilder.widthFull",
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

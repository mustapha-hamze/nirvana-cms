import mongoose from 'mongoose'
import { PAGE_ELEMENT_TYPES, CHART_TYPES, SOCIAL_PLATFORMS, GALLERY_MEDIA_TYPES } from '../../constants/pageElementTypes.js'
import { urlField, richTextSchema, imageSchema, videoEmbedSchema, headingSchema, linkSchema } from '../content/Elements.js'
import { sanitizeRichText } from '../../utils/sanitizeRichText.js'

// Base schema for one item in a page component's `elements` array — a fresh
// instance from Content's (discriminators attach per array-path, not
// globally), but richText/image/videoEmbed below are the literal schemas
// imported from content/Elements.js: same concept whether it's inside an
// article body or a page component, so those are reused as-is rather than
// redefined.
export const pageElementBaseSchema = new mongoose.Schema(
  {},
  { discriminatorKey: 'elementType', _id: true, timestamps: false },
)

// One slide in a Slider (hero) section.
export const slideSchema = new mongoose.Schema(
  {
    image: urlField(),
    imageAlt: { type: String, trim: true, default: '', maxlength: 250 },
    heading: { type: String, trim: true, default: '', maxlength: 200 },
    subheading: { type: String, trim: true, default: '', maxlength: 300 },
    ctaLabel: { type: String, trim: true, default: '', maxlength: 60 },
    ctaUrl: urlField(),
  },
  { _id: true },
)

// A Banner component always holds exactly one of these (see PAGE_COMPONENT_LAYOUTS)
// — a single static promo block, as opposed to a Slider's rotating set.
// `logo` is optional and distinct from `image` (the full-bleed background) —
// e.g. a brand mark shown beside the heading, as in a two-column hero.
export const bannerSchema = new mongoose.Schema(
  {
    image: urlField(),
    imageAlt: { type: String, trim: true, default: '', maxlength: 250 },
    logo: urlField(),
    logoAlt: { type: String, trim: true, default: '', maxlength: 250 },
    heading: { type: String, trim: true, default: '', maxlength: 200 },
    subheading: { type: String, trim: true, default: '', maxlength: 300 },
    ctaLabel: { type: String, trim: true, default: '', maxlength: 60 },
    ctaUrl: urlField(),
  },
  { _id: true },
)

export const cardSchema = new mongoose.Schema(
  {
    image: urlField(),
    imageAlt: { type: String, trim: true, default: '', maxlength: 250 },
    title: { type: String, trim: true, default: '', maxlength: 150 },
    description: { type: String, trim: true, default: '', maxlength: 500 },
    badge: { type: String, trim: true, default: '', maxlength: 40 },
    ctaLabel: { type: String, trim: true, default: '', maxlength: 60 },
    ctaUrl: urlField(),
    // Marks a card for accent styling (e.g. a category grid with one tile
    // called out in a different color) — same convention as pricingPlan's
    // `highlighted`. Not exclusive/enforced: which card(s) end up styled is a
    // frontend rendering choice, this just flags editor intent.
    highlighted: { type: Boolean, default: false },
  },
  { _id: true },
)

export const tabSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: '', maxlength: 60 },
    // Rich HTML body shown when this tab is active — same authoring surface
    // (TipTap), size ceiling, and sanitizeRichText setter as
    // content/Elements.js's richTextSchema.
    content: { type: String, default: '', maxlength: 20000, set: sanitizeRichText },
  },
  { _id: true },
)

// Shared by Accordion and FAQ components — both are "a list of expandable
// heading+body items"; FAQ is that same shape with question/answer framing,
// not a structurally different component. See constants/pageComponentTypes.js.
export const accordionItemSchema = new mongoose.Schema(
  {
    heading: { type: String, trim: true, default: '', maxlength: 200 },
    content: { type: String, default: '', maxlength: 20000, set: sanitizeRichText },
  },
  { _id: true },
)

// One rotating item in a Carousel — deliberately generic (image + caption +
// optional link) so it can carry photos, video thumbnails, or promo tiles;
// a Carousel of actual video embeds should use the Video component instead.
export const carouselItemSchema = new mongoose.Schema(
  {
    image: urlField(),
    imageAlt: { type: String, trim: true, default: '', maxlength: 250 },
    caption: { type: String, trim: true, default: '', maxlength: 300 },
    linkUrl: urlField(),
  },
  { _id: true },
)

export const pricingPlanSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '', maxlength: 60 },
    // A plain string, not a Number — needs to hold "$29", "Free", or "Contact us".
    price: { type: String, trim: true, default: '', maxlength: 40 },
    billingPeriod: { type: String, trim: true, default: '', maxlength: 40 },
    features: {
      type: [{ type: String, trim: true, maxlength: 200 }],
      default: [],
      validate: {
        validator: (arr: unknown[]) => arr.length <= 12,
        message: 'A pricing plan may list at most 12 features',
      },
    },
    ctaLabel: { type: String, trim: true, default: '', maxlength: 60 },
    ctaUrl: urlField(),
    // Visually marks the recommended/featured plan — at most one per component
    // is a UI convention, not a data-integrity rule, so it's not enforced here.
    highlighted: { type: Boolean, default: false },
  },
  { _id: true },
)

export const stepSchema = new mongoose.Schema(
  {
    // Step number is implicit (array position) — not stored, so reordering
    // never requires renumbering.
    title: { type: String, trim: true, default: '', maxlength: 150 },
    description: { type: String, trim: true, default: '', maxlength: 500 },
    icon: urlField(),
  },
  { _id: true },
)

const socialLinkSchema = new mongoose.Schema(
  {
    platform: { type: String, enum: SOCIAL_PLATFORMS, required: true },
    url: urlField(),
  },
  { _id: false },
)

export const teamMemberSchema = new mongoose.Schema(
  {
    photo: urlField(),
    name: { type: String, trim: true, default: '', maxlength: 150 },
    role: { type: String, trim: true, default: '', maxlength: 150 },
    bio: { type: String, trim: true, default: '', maxlength: 600 },
    socialLinks: {
      type: [socialLinkSchema],
      default: [],
      validate: {
        validator: (arr: unknown[]) => arr.length <= 6,
        message: 'A team member may list at most 6 social links',
      },
    },
  },
  { _id: true },
)

// Shared by Quotation, Testimonial, and Review components — all three are "a
// quote plus attribution," optionally rated. Splitting them into three
// component *types* gives editors the specific, clearly-labeled component they
// expect to pick from; giving each an identical-but-separately-maintained
// schema would just be duplication for no behavioral difference. `rating` is
// meaningful for Review and harmlessly unused by the other two.
export const testimonialItemSchema = new mongoose.Schema(
  {
    quote: { type: String, trim: true, default: '', maxlength: 800 },
    authorName: { type: String, trim: true, default: '', maxlength: 150 },
    authorRole: { type: String, trim: true, default: '', maxlength: 150 },
    avatar: urlField(),
    rating: { type: Number, min: 0, max: 5, default: null },
  },
  { _id: true },
)

export const chartDataSeriesSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: '', maxlength: 100 },
    color: { type: String, trim: true, default: '' },
    data: { type: [Number], default: [] },
  },
  { _id: false },
)

// A Chart component always holds exactly one of these (see PAGE_COMPONENT_LAYOUTS)
// — the chart itself is the "element"; series are its sub-structure, not
// separate array items, since they must all share one set of labels/axis.
export const chartDataSchema = new mongoose.Schema(
  {
    chartType: { type: String, enum: CHART_TYPES, default: 'bar' },
    title: { type: String, trim: true, default: '', maxlength: 150 },
    labels: { type: [{ type: String, trim: true, maxlength: 60 }], default: [] },
    series: {
      type: [chartDataSeriesSchema],
      default: [],
      validate: [
        {
          validator: (arr: unknown[]) => arr.length <= 8,
          message: 'A chart may have at most 8 series',
        },
        {
          // Each series must plot one value per label, or the chart can't render sensibly.
          validator(this: { labels?: unknown[] }, arr: { data: unknown[] }[]) {
            const labelCount = this.labels?.length ?? 0
            return arr.every((s) => s.data.length === labelCount)
          },
          message: 'Every series must have exactly as many data points as there are labels',
        },
      ],
    },
  },
  { _id: true },
)

// One item in a Media Gallery — deliberately one shape for all three media
// kinds (rather than three element types) since a gallery mixes them freely;
// `thumbnailUrl` previews a video/document tile, `fileName` labels a document
// download. Irrelevant fields for a given `mediaType` are simply left blank.
export const galleryItemSchema = new mongoose.Schema(
  {
    mediaType: { type: String, enum: GALLERY_MEDIA_TYPES, default: 'image' },
    url: urlField(),
    thumbnailUrl: urlField(),
    alt: { type: String, trim: true, default: '', maxlength: 250 },
    caption: { type: String, trim: true, default: '', maxlength: 300 },
    fileName: { type: String, trim: true, default: '', maxlength: 150 },
  },
  { _id: true },
)

// A CTA component always holds exactly one of these (see PAGE_COMPONENT_LAYOUTS)
// — a text-led prompt (e.g. "Subscribe to our newsletter"), as opposed to
// Banner's image-led promo block. A secondary link is optional (e.g.
// "Get started" + "Learn more").
export const ctaSchema = new mongoose.Schema(
  {
    heading: { type: String, trim: true, default: '', maxlength: 200 },
    subheading: { type: String, trim: true, default: '', maxlength: 300 },
    ctaLabel: { type: String, trim: true, default: '', maxlength: 60 },
    ctaUrl: urlField(),
    secondaryCtaLabel: { type: String, trim: true, default: '', maxlength: 60 },
    secondaryCtaUrl: urlField(),
  },
  { _id: true },
)

// One KPI/counter in a Statistics section, e.g. { value: "10K+", label: "Happy customers" }.
export const statItemSchema = new mongoose.Schema(
  {
    value: { type: String, trim: true, default: '', maxlength: 40 },
    label: { type: String, trim: true, default: '', maxlength: 150 },
    icon: urlField(),
  },
  { _id: true },
)

// One dated event in a Timeline — distinct from Step: a Step is an
// unordered-in-time numbered sequence ("how it works"), a Timeline entry is
// anchored to a specific date/period ("2020 — Founded").
export const timelineItemSchema = new mongoose.Schema(
  {
    date: { type: String, trim: true, default: '', maxlength: 60 },
    title: { type: String, trim: true, default: '', maxlength: 150 },
    description: { type: String, trim: true, default: '', maxlength: 500 },
  },
  { _id: true },
)

// A Map component always holds exactly one of these (see PAGE_COMPONENT_LAYOUTS).
// Either `embedUrl` (a pasted Google/Apple Maps embed link — the common case)
// or `latitude`/`longitude`/`zoom` may be filled in; when both are present a
// future public renderer should prefer `embedUrl`, since that's what an
// editor most recently/explicitly provided.
export const mapSchema = new mongoose.Schema(
  {
    address: { type: String, trim: true, default: '', maxlength: 300 },
    latitude: { type: Number, min: -90, max: 90, default: null },
    longitude: { type: Number, min: -180, max: 180, default: null },
    zoom: { type: Number, min: 1, max: 21, default: 14 },
    embedUrl: urlField(),
  },
  { _id: true },
)

// One project/case-study tile in a Portfolio section — Card's shape plus the
// project-specific fields (client, category, case study link) that make it
// worth its own section type rather than reusing Cards.
export const portfolioItemSchema = new mongoose.Schema(
  {
    image: urlField(),
    imageAlt: { type: String, trim: true, default: '', maxlength: 250 },
    title: { type: String, trim: true, default: '', maxlength: 150 },
    client: { type: String, trim: true, default: '', maxlength: 150 },
    category: { type: String, trim: true, default: '', maxlength: 100 },
    description: { type: String, trim: true, default: '', maxlength: 500 },
    caseStudyUrl: urlField(),
  },
  { _id: true },
)

// A Feature component always holds exactly one of these (see PAGE_COMPONENT_LAYOUTS)
// — an image-led "about/why us" block: a photo, a heading with an optional
// accent-colored trailing phrase (`highlightText`, e.g. "...around the WORLD"),
// a description, a short checklist (`items`, styled with a check icon by the
// renderer — plain strings here, same shape as pricingPlan's `features`), and
// an optional floating badge graphic (e.g. an award seal).
export const featureSchema = new mongoose.Schema(
  {
    image: urlField(),
    imageAlt: { type: String, trim: true, default: '', maxlength: 250 },
    heading: { type: String, trim: true, default: '', maxlength: 200 },
    highlightText: { type: String, trim: true, default: '', maxlength: 100 },
    description: { type: String, trim: true, default: '', maxlength: 600 },
    items: {
      type: [{ type: String, trim: true, maxlength: 200 }],
      default: [],
      validate: {
        validator: (arr: unknown[]) => arr.length <= 12,
        message: 'A feature section may list at most 12 items',
      },
    },
    badgeImage: urlField(),
    badgeImageAlt: { type: String, trim: true, default: '', maxlength: 250 },
  },
  { _id: true },
)

// Attaches every page element discriminator to the given array-of-elements
// path. Call once, right after the owning schema (page/Section.js) declares
// its `elements` field — same convention as attachElementDiscriminators in
// content/Elements.js.
export function attachPageElementDiscriminators(elementsPath: mongoose.Schema.Types.DocumentArray) {
  elementsPath.discriminator(PAGE_ELEMENT_TYPES.RICH_TEXT, richTextSchema)
  elementsPath.discriminator(PAGE_ELEMENT_TYPES.IMAGE, imageSchema)
  elementsPath.discriminator(PAGE_ELEMENT_TYPES.VIDEO_EMBED, videoEmbedSchema)
  elementsPath.discriminator(PAGE_ELEMENT_TYPES.SLIDE, slideSchema)
  elementsPath.discriminator(PAGE_ELEMENT_TYPES.BANNER, bannerSchema)
  elementsPath.discriminator(PAGE_ELEMENT_TYPES.CARD, cardSchema)
  elementsPath.discriminator(PAGE_ELEMENT_TYPES.TAB, tabSchema)
  elementsPath.discriminator(PAGE_ELEMENT_TYPES.ACCORDION_ITEM, accordionItemSchema)
  elementsPath.discriminator(PAGE_ELEMENT_TYPES.CAROUSEL_ITEM, carouselItemSchema)
  elementsPath.discriminator(PAGE_ELEMENT_TYPES.PRICING_PLAN, pricingPlanSchema)
  elementsPath.discriminator(PAGE_ELEMENT_TYPES.STEP, stepSchema)
  elementsPath.discriminator(PAGE_ELEMENT_TYPES.TEAM_MEMBER, teamMemberSchema)
  elementsPath.discriminator(PAGE_ELEMENT_TYPES.TESTIMONIAL_ITEM, testimonialItemSchema)
  elementsPath.discriminator(PAGE_ELEMENT_TYPES.CHART_DATA, chartDataSchema)
  elementsPath.discriminator(PAGE_ELEMENT_TYPES.GALLERY_ITEM, galleryItemSchema)
  elementsPath.discriminator(PAGE_ELEMENT_TYPES.CTA, ctaSchema)
  elementsPath.discriminator(PAGE_ELEMENT_TYPES.STAT_ITEM, statItemSchema)
  elementsPath.discriminator(PAGE_ELEMENT_TYPES.TIMELINE_ITEM, timelineItemSchema)
  elementsPath.discriminator(PAGE_ELEMENT_TYPES.MAP, mapSchema)
  elementsPath.discriminator(PAGE_ELEMENT_TYPES.PORTFOLIO_ITEM, portfolioItemSchema)
  elementsPath.discriminator(PAGE_ELEMENT_TYPES.FEATURE, featureSchema)
  elementsPath.discriminator(PAGE_ELEMENT_TYPES.HEADING, headingSchema)
  elementsPath.discriminator(PAGE_ELEMENT_TYPES.LINK, linkSchema)
}

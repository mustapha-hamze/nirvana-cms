import mongoose from 'mongoose'
import { PAGE_COMPONENT_TYPE_VALUES } from '../../constants/pageComponentTypes.js'
import {
  SECTION_SPACING_VALUES,
  SECTION_WIDTH_VALUES,
  SECTION_TEXT_ALIGN_VALUES,
} from '../../constants/pageSectionSettings.js'
import { pageElementBaseSchema, attachPageElementDiscriminators } from './Elements.js'

// Presentational settings shared by every section — background color,
// vertical spacing, content width, and text alignment. Deliberately flat and
// component-agnostic (unlike `components`, which is type-specific): these are
// layout knobs an editor expects to find the same way on any section, not
// data any one component displays.
const sectionSettingsSchema = new mongoose.Schema(
  {
    // Free-form CSS color (hex, rgb(), or a named color) rather than an enum —
    // this is presentational, not a data-integrity concern, and a fixed swatch
    // list would just get in a designer's way. Capped at a sane length only to
    // stop the field being used to stash unrelated data.
    backgroundColor: { type: String, trim: true, default: '', maxlength: 40 },
    spacing: { type: String, enum: SECTION_SPACING_VALUES, default: 'normal' },
    width: { type: String, enum: SECTION_WIDTH_VALUES, default: 'contained' },
    textAlign: { type: String, enum: SECTION_TEXT_ALIGN_VALUES, default: 'left' },
  },
  { _id: false },
)

// One component placed inside a section — what used to be an entire
// section's `type` + `elements` before sections became generic containers.
// Still structurally the same idea: a `type` (Banner, Cards, Hero Slider, a
// primitive Heading/Image/Link, ...) plus the ordered, homogeneous list of
// elements that type holds, per PAGE_COMPONENT_LAYOUTS's { elementType, min,
// max } — not encoded as separate Mongoose discriminators for the component
// itself, same rationale as content/Section.js's own sections.
const pageComponentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: PAGE_COMPONENT_TYPE_VALUES, required: true },
    elements: { type: [pageElementBaseSchema], default: [] },
  },
  { _id: true, timestamps: false },
)

attachPageElementDiscriminators(pageComponentSchema.path('elements'))

// A section is now a generic, empty container an editor fills with one or
// more components — it carries no `type` of its own (that lived here before
// components existed; see pageComponentSchema above). `components` may be
// empty: a freshly added section starts blank, and PAGE_COMPONENT_LAYOUTS'
// min/max only constrain a component's own element count, not how many
// components a section holds (validated in pageController's
// validatePageSections(), same as before).
export const pageSectionSchema = new mongoose.Schema(
  {
    // Admin-facing label, e.g. "About Us" — language-specific since sections
    // live under PageDetails. Not `required`: sections saved before this
    // field existed have none, and the schema default of '' lets them keep
    // loading/saving untouched.
    title: { type: String, trim: true, default: '', maxlength: 120 },
    // Lets an editor keep a section authored but temporarily out of the
    // rendered page — e.g. a seasonal promo or a section still being
    // finalized — without losing its content by deleting it outright.
    isVisible: { type: Boolean, default: true },
    settings: { type: sectionSettingsSchema, default: () => ({}) },
    components: { type: [pageComponentSchema], default: [] },
  },
  { _id: true, timestamps: false },
)

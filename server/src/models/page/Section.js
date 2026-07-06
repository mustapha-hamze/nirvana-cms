import mongoose from 'mongoose'
import { PAGE_SECTION_TYPE_VALUES } from '../../constants/pageSectionTypes.js'
import {
  SECTION_SPACING_VALUES,
  SECTION_WIDTH_VALUES,
  SECTION_TEXT_ALIGN_VALUES,
} from '../../constants/pageSectionSettings.js'
import { pageElementBaseSchema, attachPageElementDiscriminators } from './Elements.js'

// Presentational settings shared by every section type — background color,
// vertical spacing, content width, and text alignment. Deliberately flat and
// type-agnostic (unlike `elements`, which is type-specific): these are layout
// knobs an editor expects to find the same way on any section, not data the
// section displays.
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

// Same non-discriminated-wrapper approach as content/Section.js: every page
// section is structurally identical at the persistence layer (a `type` plus
// an ordered `elements` array, plus the visibility/settings below). What
// differs between a Slider and a Team section is a business rule — which
// single element type its list holds, and how many — captured in
// constants/pageSectionTypes.js's PAGE_SECTION_LAYOUTS and checked in
// pageController.validatePageSections(), not encoded as separate Mongoose
// discriminators for the section itself.
export const pageSectionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: PAGE_SECTION_TYPE_VALUES, required: true },
    // Lets an editor keep a section authored but temporarily out of the
    // rendered page — e.g. a seasonal Banner or a Statistics section still
    // being finalized — without losing its content by deleting it outright.
    isVisible: { type: Boolean, default: true },
    settings: { type: sectionSettingsSchema, default: () => ({}) },
    elements: { type: [pageElementBaseSchema], default: [] },
  },
  { _id: true, timestamps: false },
)

attachPageElementDiscriminators(pageSectionSchema.path('elements'))

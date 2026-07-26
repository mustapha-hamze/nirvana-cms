import mongoose from 'mongoose'
import { ELEMENT_TYPES, HEADING_LEVELS } from '../../constants/elementTypes.js'
import { sanitizeRichText } from '../../utils/sanitizeRichText.js'

// Cheap defense-in-depth only — confirms the value is one of:
//  - an absolute http(s) URL (an external link, e.g. a pasted YouTube URL)
//  - a root-relative path (e.g. "/channels#series"), so editors can link
//    within a frontend they don't want to hardcode a domain for — the
//    frontend resolves it against its own origin at render time
//  - a bare filename (e.g. "3f9e...-a1.png"), what image/video/document
//    uploads now store (see utils/imageStorage.js, utils/rawFileUpload.js) —
//    the admin panel reconstructs a displayable URL from {kind, domain,
//    filename} itself (client/src/utils/mediaUrl.ts); the public frontend
//    API returns this raw value as-is (a known v1 gap for uploaded media —
//    only pasted external URLs resolve directly for public consumers today)
// Real embeddability (e.g. is this actually a YouTube/Vimeo link) is NOT
// validated here; that's a known v1 gap, consistent with elements storing a
// plain string rather than going through full media-pipeline validation.
// The bare-filename branch excludes ":" so it can't match a dangerous
// scheme (javascript:, vbscript:, data:, ...) — real filenames never
// contain one, but a scheme prefix would otherwise slip through untyped.
const URL_PATTERN = /^(https?:\/\/\S+|\/\S*|[^\s/:]+)$/

// Not `required` — a section is allowed to be a half-filled draft (see note
// on leaf fields below). Skips the pattern check on an empty string so an
// unfinished field doesn't itself become a validation failure; once there's
// a value, it must actually look like a URL or filename.
// Exported so other element catalogs (e.g. models/page/Elements.js) can build
// their own url-shaped fields without duplicating the validation pattern.
export const urlField = (extra = {}) => ({
  type: String,
  trim: true,
  default: '',
  validate: {
    validator: (v) => !v || URL_PATTERN.test(v),
    message: (props) => `${props.value} must be an absolute http(s) URL, a path starting with "/", or a filename`,
  },
  ...extra,
})

// Base schema for one item in a Section's `elements` array. Real fields live
// entirely on the discriminators below — `elementType` (the discriminator
// key) is what tells Mongoose which one to cast a given array entry into.
export const elementBaseSchema = new mongoose.Schema(
  {},
  { discriminatorKey: 'elementType', _id: true, timestamps: false },
)

// None of these leaf fields (text/html/alt/label/...) are `required`. A
// section is edited as part of one whole-document save alongside every other
// section — Mongoose validates the entire ContentDetails document before
// saving any of it, so one empty required field anywhere would block saving
// the WHOLE document (title, other sections, everything), not just flag the
// one incomplete element. A half-filled section (e.g. one of two text slots
// still blank) needs to be saveable as a draft; completeness is a content
// authoring concern, not a persistence-layer one.
export const paragraphSchema = new mongoose.Schema(
  {
    text: { type: String, trim: true, default: '', maxlength: 2000 },
  },
  { _id: true },
)

// Raw HTML produced by the client's rich text editor (TipTap), run through
// sanitizeRichText on every assignment (a Mongoose setter, not a one-off
// controller call) so persisted HTML can only ever be as permissive as that
// allowlist — regardless of which code path wrote it.
export const richTextSchema = new mongoose.Schema(
  {
    html: { type: String, default: '', maxlength: 20000, set: sanitizeRichText },
  },
  { _id: true },
)

export const headingSchema = new mongoose.Schema(
  {
    level: { type: Number, enum: HEADING_LEVELS, default: 2 },
    text: { type: String, trim: true, default: '', maxlength: 300 },
  },
  { _id: true },
)

// Distinct from `paragraph` — a short single-line field (e.g. a subtitle or
// label), rendered as a plain <input> client-side rather than a <textarea>.
export const textInputSchema = new mongoose.Schema(
  {
    text: { type: String, trim: true, default: '', maxlength: 300 },
  },
  { _id: true },
)

export const imageSchema = new mongoose.Schema(
  {
    url: urlField(),
    alt: { type: String, trim: true, default: '', maxlength: 250 },
    caption: { type: String, trim: true, default: '', maxlength: 500 },
  },
  { _id: true },
)

export const imageGallerySchema = new mongoose.Schema(
  {
    images: {
      type: [
        {
          url: urlField(),
          alt: { type: String, trim: true, default: '', maxlength: 250 },
          caption: { type: String, trim: true, default: '', maxlength: 500 },
        },
      ],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length >= 2 && arr.length <= 20,
        message: 'imageGallery requires between 2 and 20 images',
      },
    },
  },
  { _id: true },
)

export const linkSchema = new mongoose.Schema(
  {
    url: urlField(),
    label: { type: String, trim: true, default: '', maxlength: 150 },
    newTab: { type: Boolean, default: false },
  },
  { _id: true },
)

export const videoEmbedSchema = new mongoose.Schema(
  {
    url: urlField(),
    caption: { type: String, trim: true, default: '', maxlength: 500 },
  },
  { _id: true },
)

// Attaches all element discriminators to the given array-of-elements path.
// Call this once, right after the owning schema (Section) declares its
// `elements` field — Mongoose discriminators must be attached to an actual
// DocumentArray path, not to elementBaseSchema itself.
export function attachElementDiscriminators(elementsPath) {
  elementsPath.discriminator(ELEMENT_TYPES.PARAGRAPH, paragraphSchema)
  elementsPath.discriminator(ELEMENT_TYPES.RICH_TEXT, richTextSchema)
  elementsPath.discriminator(ELEMENT_TYPES.HEADING, headingSchema)
  elementsPath.discriminator(ELEMENT_TYPES.TEXT_INPUT, textInputSchema)
  elementsPath.discriminator(ELEMENT_TYPES.IMAGE, imageSchema)
  elementsPath.discriminator(ELEMENT_TYPES.IMAGE_GALLERY, imageGallerySchema)
  elementsPath.discriminator(ELEMENT_TYPES.LINK, linkSchema)
  elementsPath.discriminator(ELEMENT_TYPES.VIDEO_EMBED, videoEmbedSchema)
}

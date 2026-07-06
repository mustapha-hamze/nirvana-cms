// Presentational knobs that apply uniformly to every page section type —
// unlike PAGE_SECTION_LAYOUTS (which element type/count a section holds),
// these don't vary by section type, so they're one shared settings shape
// rather than per-type fields. See models/page/Section.js's sectionSettingsSchema.
export const SECTION_SPACING_VALUES = Object.freeze(['compact', 'normal', 'spacious'])
export const SECTION_WIDTH_VALUES = Object.freeze(['contained', 'full'])
export const SECTION_TEXT_ALIGN_VALUES = Object.freeze(['left', 'center', 'right'])

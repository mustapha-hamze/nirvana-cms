// Presentational knobs that apply uniformly to every section, regardless of
// which components it holds — unlike PAGE_COMPONENT_LAYOUTS (which element
// type/count a given component holds), these live on the section itself as
// one shared settings shape. See models/page/Section.js's sectionSettingsSchema.
export const SECTION_SPACING_VALUES = Object.freeze(['compact', 'normal', 'spacious'])
export const SECTION_WIDTH_VALUES = Object.freeze(['contained', 'full'])
export const SECTION_TEXT_ALIGN_VALUES = Object.freeze(['left', 'center', 'right'])

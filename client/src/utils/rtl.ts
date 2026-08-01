// Automatic per-field RTL detection for the admin panel — any text field or
// preview containing Persian/Arabic/Urdu script should render right-to-left
// with the Persian-friendly Vazirmatn font (see index.css's `.rtl-text`),
// regardless of which language tab it happens to live under. Detection is
// content-based (the field's own current value), not language-tab-based, so
// mixed-language content renders correctly per field.

// Unicode blocks covering the Arabic script used by Persian, Arabic, and
// Urdu — Persian/Urdu don't have their own separate blocks, they reuse the
// core Arabic block plus these supplementary/presentation-forms ranges for
// their extra letters. Expressed as numeric code points (not literal
// characters or \u escapes) so this file stays plain ASCII and every range
// is an auditable, unambiguous number — some codepoints in the
// presentation-forms ranges are invisible bidi/formatting marks (e.g.
// U+FEFF), which have no business being pasted as literal bytes into source.
const RTL_CODE_POINT_RANGES: [start: number, end: number][] = [
  [0x0600, 0x06ff], // Arabic
  [0x0750, 0x077f], // Arabic Supplement
  [0x08a0, 0x08ff], // Arabic Extended-A
  [0xfb50, 0xfdff], // Arabic Presentation Forms-A
  [0xfe70, 0xfeff], // Arabic Presentation Forms-B (incl. Urdu presentation glyphs)
]

const RTL_CHAR_PATTERN = new RegExp(
  '[' +
    RTL_CODE_POINT_RANGES.map(
      ([start, end]) => `${String.fromCodePoint(start)}-${String.fromCodePoint(end)}`,
    ).join('') +
    ']',
)

// Safely handles the shapes these fields actually pass through as `value`:
// a plain string (the common case), an array of strings (e.g. a section's
// `metadata.keywords` or a `StringListField`'s values), or anything else
// (null/undefined/number/boolean/object), which can never contain text and
// is treated as not RTL rather than thrown on.
export function containsRtlText(value: unknown): boolean {
  if (typeof value === 'string') return RTL_CHAR_PATTERN.test(value)
  if (Array.isArray(value)) return value.some(containsRtlText)
  return false
}

// The direction to actually render a field in. `fallback` is only consulted
// when `value` is empty/not-yet-typed-into — once there's any real text,
// content wins: RTL script anywhere in the value means 'rtl', any other
// non-empty text means 'ltr' (this is what lets a caller's language-tab-based
// default apply only to a blank field and never override real typed content).
export function getTextDirection(value: unknown, fallback: 'ltr' | 'rtl' = 'ltr'): 'ltr' | 'rtl' {
  if (containsRtlText(value)) return 'rtl'
  if (typeof value === 'string' && value.length > 0) return 'ltr'
  if (Array.isArray(value) && value.some((v) => typeof v === 'string' && v.length > 0)) return 'ltr'
  return fallback
}

// Class name applying the Vazirmatn font + RTL alignment (see index.css) —
// only ever returned when the value actually contains RTL script, never
// applied ambiently.
export function getRtlAwareClassName(value: unknown): string {
  return containsRtlText(value) ? 'rtl-text' : ''
}

// Convenience bundle for spreading onto a read-only preview element, e.g.
// `<span {...rtlTextProps(title)}>{title}</span>`.
export function rtlTextProps(value: unknown, fallback: 'ltr' | 'rtl' = 'ltr'): { dir: 'ltr' | 'rtl'; className: string } {
  return { dir: getTextDirection(value, fallback), className: getRtlAwareClassName(value) }
}

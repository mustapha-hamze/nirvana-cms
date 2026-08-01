import { getTextDirection } from '../utils/rtl'

// Thin hook wrapper around getTextDirection — the natural seam if detection
// ever needs to become stateful/memoized (e.g. for a very large rich text
// blob); today it's just a direct, cheap call re-evaluated on every render.
export function useTextDirection(value: unknown, fallback: 'ltr' | 'rtl' = 'ltr'): 'ltr' | 'rtl' {
  return getTextDirection(value, fallback)
}

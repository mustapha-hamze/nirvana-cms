// crypto.randomUUID() requires a secure context (HTTPS or localhost) and
// throws "crypto.randomUUID is not a function" everywhere else — e.g. a
// deployment reached over plain HTTP by IP, with no TLS/domain set up yet.
// crypto.getRandomValues() has no such restriction, so this falls back to
// manually formatting a UUID v4 from it — same quality of randomness,
// available unconditionally.
export function randomUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40 // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // variant 10xx
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

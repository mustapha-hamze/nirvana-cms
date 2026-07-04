// Unicode-aware: keeps any language's letters/numbers (Persian, Arabic, etc.),
// not just ASCII a-z0-9 — a plain ASCII filter would slugify a Persian title
// down to an empty string.
export function slugify(text) {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

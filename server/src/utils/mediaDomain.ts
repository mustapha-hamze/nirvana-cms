// The `domain` an upload belongs to ('content' | 'page' | 'author' | ...) stays
// this way throughout the codebase (component props, function params, etc.)
// — only the actual on-disk/URL folder name is plural, matching images/videos/
// documents. Shared by imageStorage.js, menuImageUpload.js and rawFileUpload.js
// so the domains' folder names can't drift apart.
export type MediaDomain = 'content' | 'page' | 'author' | 'menuCategory' | 'menuItem'

export const DOMAIN_FOLDER: Record<MediaDomain, string> = Object.freeze({
  content: 'contents',
  page: 'pages',
  author: 'authors',
  // Nested under a shared 'menu' folder rather than flat like the others —
  // category and item images are otherwise indistinguishable random UUID
  // filenames, and keeping them apart on disk makes each independently
  // reasoned-about/cleaned-up, same rationale as the other domains' split.
  menuCategory: 'menu/categories',
  menuItem: 'menu/items',
})

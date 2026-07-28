// The `domain` an upload belongs to ('content' | 'page') stays this way
// throughout the codebase (component props, function params, etc.) — only
// the actual on-disk/URL folder name is plural, matching images/videos/
// documents. Shared by imageStorage.js and rawFileUpload.js so the two
// domains' folder names can't drift apart.
export type MediaDomain = 'content' | 'page'

export const DOMAIN_FOLDER: Record<MediaDomain, string> = Object.freeze({
  content: 'contents',
  page: 'pages',
})

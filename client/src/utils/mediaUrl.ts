// Uploaded image/video/document fields (see api/client.ts's upload
// functions) store just a bare filename in the database now, not a full
// URL — matches server/src/utils/imageStorage.js and rawFileUpload.js,
// which return the same. This reconstructs a displayable URL from a stored
// value for the admin panel, which already knows the media kind and domain
// from whichever upload field is asking (see ImageUploadField/FileUploadField).
//
// A stored value can also be a full external URL (an editor pasted a
// YouTube link, or the value predates this filename-only convention) — used
// as-is in that case, no reconstruction needed.
export type MediaKind = 'images' | 'videos' | 'documents'
export type MediaDomain = 'content' | 'page'

// `domain` stays singular everywhere it's used as an identifier (component
// props, function params, ...) — only the on-disk/URL folder name is plural,
// matching images/videos/documents. Mirrors server/src/utils/mediaDomain.js.
const DOMAIN_FOLDER: Record<MediaDomain, string> = {
  content: 'contents',
  page: 'pages',
}

export function resolveMediaUrl(kind: MediaKind, domain: MediaDomain, value: string): string {
  if (!value || /^https?:\/\//i.test(value)) return value
  return `/storage/${kind}/${DOMAIN_FOLDER[domain]}/${value}`
}

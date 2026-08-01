import type { LangKey, ContentMetadata, ContentSection } from '../types/content'
import type { PageMetadata, PageSection } from '../types/page'

export type ApiError = { message: string }

export type GeneratedContentTranslation = {
  langKey: LangKey
  title: string
  headline: string
  abstract: string
  status: 'draft'
  metadata: ContentMetadata
  sections: ContentSection[]
}

export type GeneratedPageTranslation = {
  langKey: LangKey
  title: string
  status: 'draft'
  metadata: PageMetadata
  sections: PageSection[]
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = localStorage.getItem('token')
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) return undefined as T

  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Request failed')
  return data as T
}

export const api = {
  get:    <T>(path: string)                  => request<T>('GET', path),
  post:   <T>(path: string, body?: unknown)  => request<T>('POST', path, body),
  put:    <T>(path: string, body?: unknown)  => request<T>('PUT', path, body),
  patch:  <T>(path: string, body?: unknown)  => request<T>('PATCH', path, body),
  delete: <T>(path: string)                  => request<T>('DELETE', path),
}

export async function uploadLogo(applicationId: string, file: File): Promise<{ logo: string }> {
  const token = localStorage.getItem('token')
  const form = new FormData()
  form.append('logo', file)

  const res = await fetch(`/api/applications/${applicationId}/logo`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Upload failed')
  return data
}

// Shared multipart-upload plumbing for every file-upload endpoint below —
// each just differs in path and the form field name multer expects. Returns
// just the bare filename the server saved (not a URL) — that's what gets
// stored in the database; callers reconstruct a displayable URL themselves
// via utils/mediaUrl.ts's resolveMediaUrl, which they can do because they
// already know the media kind and domain (they picked which upload* function
// to call).
async function uploadFile(path: string, fieldName: string, applicationId: string, file: File): Promise<{ filename: string }> {
  const token = localStorage.getItem('token')
  const form = new FormData()
  form.append('application', applicationId)
  form.append(fieldName, file)

  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Upload failed')
  return data
}

// Used by image/imageGallery content-body elements — stored under
// storage/images/content.
export function uploadContentImage(applicationId: string, file: File): Promise<{ filename: string }> {
  return uploadFile('/content/images', 'image', applicationId, file)
}

// Self-hosted video for content's videoEmbed elements — stored under
// storage/videos/content.
export function uploadContentVideo(applicationId: string, file: File): Promise<{ filename: string }> {
  return uploadFile('/content/videos', 'video', applicationId, file)
}

// Used by page section elements (banner, cards, slides, ...) — stored under
// storage/images/page, kept separate from content's uploads.
export function uploadPageImage(applicationId: string, file: File): Promise<{ filename: string }> {
  return uploadFile('/pages/images', 'image', applicationId, file)
}

// Self-hosted video for page's videoEmbed/gallery elements — stored under
// storage/videos/page.
export function uploadPageVideo(applicationId: string, file: File): Promise<{ filename: string }> {
  return uploadFile('/pages/videos', 'video', applicationId, file)
}

// Document upload for page's gallery elements (mediaType: "document") —
// stored under storage/documents/page.
export function uploadPageDocument(applicationId: string, file: File): Promise<{ filename: string }> {
  return uploadFile('/pages/documents', 'document', applicationId, file)
}

// Generates a draft translation from an existing language on this content
// item, via the application's AI API key — returns the draft only, it is
// never persisted server-side. The caller inserts it into local draft state
// and saves it through the normal PUT .../details/:langKey flow, same as a
// manually-typed translation.
export function generateContentTranslation(
  contentId: string,
  sourceLangKey: LangKey,
  targetLangKey: LangKey,
): Promise<GeneratedContentTranslation> {
  return api.post<GeneratedContentTranslation>(`/content/${contentId}/translations/generate`, {
    sourceLangKey,
    targetLangKey,
  })
}

// Same as generateContentTranslation, for pages.
export function generatePageTranslation(
  pageId: string,
  sourceLangKey: LangKey,
  targetLangKey: LangKey,
): Promise<GeneratedPageTranslation> {
  return api.post<GeneratedPageTranslation>(`/pages/${pageId}/translations/generate`, {
    sourceLangKey,
    targetLangKey,
  })
}

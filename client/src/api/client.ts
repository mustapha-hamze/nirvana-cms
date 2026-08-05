import type { LangKey, ContentMetadata, ContentSection } from '../types/content'
import type { PageMetadata, PageSection } from '../types/page'
import { store } from '../store'
import { logout, setAccessToken } from '../store/authSlice'

export type ApiError = { message: string }

const ACCESS_TOKEN_KEY = 'token'
const REFRESH_TOKEN_KEY = 'refreshToken'

// Local storage isn't the ideal place for a refresh token — an XSS bug can
// read it, unlike an httpOnly cookie — but the app already stores the access
// token there (see authSlice.ts), and /api/frontend-style cookie+CORS
// credentials rework isn't warranted for a staff admin panel that already
// sits behind its own login. Tracked as a tradeoff, not an oversight.
function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

function persistTokens(token: string, refreshToken: string) {
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  store.dispatch(setAccessToken(token))
}

// Clears both Redux auth state and localStorage (see authSlice's `logout`
// reducer). Every route but /login is wrapped in App.tsx's ProtectedRoute,
// which reads isAuthenticated from Redux — dispatching this is enough to
// bounce the user to /login on the next render, no manual navigation needed.
function clearAuthState() {
  store.dispatch(logout())
}

// Endpoints the 401 → refresh → retry interceptor must never touch: /login
// returning 401 is an ordinary bad-credentials response (not an expired
// session), and /refresh's own 401 IS the "refresh failed" signal below —
// retrying it would recurse forever.
const REFRESH_EXEMPT_PATHS = new Set(['/auth/login', '/auth/refresh'])

// Ensures concurrent 401s across in-flight requests share one /auth/refresh
// call instead of firing one each.
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return null

    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      if (!res.ok) return null

      const data = await res.json()
      persistTokens(data.token, data.refreshToken)
      return data.token as string
    } catch {
      return null
    }
  })()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

// Best-effort server-side revoke of the current refresh token, then always
// clears local auth state regardless of whether the request succeeded.
export async function logoutRequest(): Promise<void> {
  const refreshToken = getRefreshToken()
  if (refreshToken) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
    } catch {
      // Network error revoking server-side — local state still clears below.
    }
  }
  clearAuthState()
}

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

async function request<T>(method: string, path: string, body?: unknown, isRetry = false): Promise<T> {
  const token = getAccessToken()
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) return undefined as T

  if (res.status === 401 && !isRetry && !REFRESH_EXEMPT_PATHS.has(path)) {
    const newToken = await refreshAccessToken()
    if (newToken) return request<T>(method, path, body, true)
    clearAuthState()
    throw new Error('Your session has expired. Please sign in again.')
  }

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

// Shared multipart-upload plumbing (same 401 → refresh → retry handling as
// request() above) for every upload* function below — each just differs in
// path and form fields.
async function uploadRequest<T>(path: string, form: FormData, isRetry = false): Promise<T> {
  const token = getAccessToken()
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  })

  if (res.status === 401 && !isRetry) {
    const newToken = await refreshAccessToken()
    if (newToken) return uploadRequest<T>(path, form, true)
    clearAuthState()
    throw new Error('Your session has expired. Please sign in again.')
  }

  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Upload failed')
  return data as T
}

export function uploadLogo(applicationId: string, file: File): Promise<{ logo: string }> {
  const form = new FormData()
  form.append('logo', file)
  return uploadRequest(`/applications/${applicationId}/logo`, form)
}

// Returns just the bare filename the server saved (not a URL) — that's what
// gets stored in the database; callers reconstruct a displayable URL
// themselves via utils/mediaUrl.ts's resolveMediaUrl, which they can do
// because they already know the media kind and domain (they picked which
// upload* function to call).
function uploadFile(path: string, fieldName: string, applicationId: string, file: File): Promise<{ filename: string }> {
  const form = new FormData()
  form.append('application', applicationId)
  form.append(fieldName, file)
  return uploadRequest(path, form)
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

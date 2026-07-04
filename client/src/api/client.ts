export type ApiError = { message: string }

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

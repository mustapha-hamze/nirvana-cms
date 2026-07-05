import { useState } from 'react'
import { theme } from '../../theme'
import { uploadContentImage } from '../../api/client'

const MAX_BYTES = 1024 * 1024

export default function ImageUploadField({
  applicationId,
  url,
  onUploaded,
}: {
  applicationId: string
  url: string
  onUploaded: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file to re-upload/replace
    if (!file) return
    if (file.size > MAX_BYTES) {
      setError('Image must be smaller than 1MB')
      return
    }
    setError('')
    setUploading(true)
    try {
      const { url: uploadedUrl } = await uploadContentImage(applicationId, file)
      onUploaded(uploadedUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: theme.textSecondary }}>
        Image {uploading && <span style={{ color: theme.textTertiary }}>— uploading…</span>}
      </label>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleFileChange}
        disabled={uploading}
        className="block w-full text-sm"
        style={{ color: theme.textSecondary }}
      />
      <p className="text-xs mt-1" style={{ color: theme.textTertiary }}>
        PNG, JPEG, WEBP, or GIF — up to 1MB.
      </p>
      {error && (
        <p className="text-xs mt-1" style={{ color: theme.danger }}>
          {error}
        </p>
      )}
      {url && (
        // Keyed by url so a fresh <img> mounts per upload — otherwise a
        // previous broken-image load's hidden state would stick around.
        <div className="mt-2 rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.inputBorder}` }}>
          <img key={url} src={url} alt="" className="w-full max-h-48 object-cover" />
        </div>
      )}
    </div>
  )
}

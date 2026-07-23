import { useState } from 'react'
import { theme } from '../../theme'
import { uploadContentImage, uploadPageImage } from '../../api/client'
import { resolveMediaUrl } from '../../utils/mediaUrl'

const MAX_BYTES = 2 * 1024 * 1024

export default function ImageUploadField({
  applicationId,
  url,
  onUploaded,
  label = 'Image',
  // Which editor domain this upload belongs to — determines storage location
  // server-side (storage/images/content vs storage/images/page). Defaults to
  // 'content' since that's this shared component's original/majority caller;
  // every pageBody/* usage passes 'page' explicitly.
  domain = 'content',
}: {
  applicationId: string
  url: string
  onUploaded: (url: string) => void
  label?: string
  domain?: 'content' | 'page'
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file to re-upload/replace
    if (!file) return
    if (file.size > MAX_BYTES) {
      setError('Image must be smaller than 2MB')
      return
    }
    setError('')
    setUploading(true)
    try {
      const upload = domain === 'page' ? uploadPageImage : uploadContentImage
      // `url` prop/onUploaded value is really "whatever's stored" — a bare
      // filename for a fresh upload here, or (for existing data) a full URL;
      // resolveMediaUrl below is what turns either into something <img> can load.
      const { filename } = await upload(applicationId, file)
      onUploaded(filename)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: theme.textSecondary }}>
        {label} {uploading && <span style={{ color: theme.textTertiary }}>— uploading…</span>}
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
        PNG, JPEG, WEBP, or GIF — up to 2MB.
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
          <img key={url} src={resolveMediaUrl('images', domain, url)} alt="" className="w-full max-h-48 object-cover" />
        </div>
      )}
    </div>
  )
}

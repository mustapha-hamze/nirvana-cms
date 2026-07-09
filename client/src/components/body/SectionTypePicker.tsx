import { useState, useRef, useEffect, type ComponentType } from 'react'
import { theme } from '../../theme'
import {
  PlusIcon,
  TextOneColIcon,
  TextTwoColIcon,
  TextImageIcon,
  TextVideoIcon,
  VideoTextIcon,
  ImageOnlyIcon,
  ImageTwoUpIcon,
  ImageGalleryIcon,
  VideoOnlyIcon,
  DocumentPlainIcon,
} from '../icons'
import type { SectionType } from '../../types/content'
import { SECTION_TYPE_VALUES, SECTION_TYPE_LABELS } from '../../constants/contentSections'

const SECTION_ICONS: Record<SectionType, ComponentType<{ size?: number }>> = {
  'text-1-col': TextOneColIcon,
  'text-2-col': TextTwoColIcon,
  'text-image': TextImageIcon,
  'text-video': TextVideoIcon,
  'video-text': VideoTextIcon,
  'image-only': ImageOnlyIcon,
  'image-2-up': ImageTwoUpIcon,
  'image-gallery': ImageGalleryIcon,
  'video-only': VideoOnlyIcon,
  document: DocumentPlainIcon,
}

export default function SectionTypePicker({ onPick }: { onPick: (type: SectionType) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97]"
        style={{ background: theme.accentGradient, boxShadow: '0 2px 16px rgba(124,58,237,0.35)' }}
      >
        <PlusIcon />
        Add Section
      </button>
      {open && (
        <div
          className="absolute right-0 z-20 mt-2 p-3 rounded-2xl shadow-2xl grid grid-cols-2 gap-1.5 w-96"
          style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
        >
          {SECTION_TYPE_VALUES.map((type) => {
            const Icon = SECTION_ICONS[type]
            return (
              <button
                key={type}
                type="button"
                onClick={() => {
                  onPick(type)
                  setOpen(false)
                }}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition"
                style={{ color: theme.textPrimary }}
                onMouseEnter={(e) => (e.currentTarget.style.background = theme.surfaceHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ color: theme.accent }}>
                  <Icon size={20} />
                </span>
                {SECTION_TYPE_LABELS[type]}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

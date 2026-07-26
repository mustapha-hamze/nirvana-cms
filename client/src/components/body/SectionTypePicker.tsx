import type { ComponentType } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button">
          <PlusIcon />
          Add Section
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="grid w-96 grid-cols-2 gap-1.5 p-3">
        {SECTION_TYPE_VALUES.map((type) => {
          const Icon = SECTION_ICONS[type]
          return (
            <DropdownMenuItem
              key={type}
              onClick={() => onPick(type)}
              className="gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium"
            >
              <span className="text-primary">
                <Icon size={20} />
              </span>
              {SECTION_TYPE_LABELS[type]}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

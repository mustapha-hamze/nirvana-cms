import { useState, useRef, useEffect, type ComponentType } from 'react'
import { theme } from '../../theme'
import {
  PlusIcon, SliderIcon, BannerIcon, DocumentPlainIcon, CardsIcon, TabsIcon, AccordionIcon, FaqIcon,
  CarouselIcon, ImageOnlyIcon, TagIcon, StepsIcon, UsersIcon, QuotationIcon, TestimonialIcon, ReviewIcon,
  VideoOnlyIcon, ChartIcon, ImageGalleryIcon, CtaIcon, StatIcon, TimelineIcon, MapIcon, PortfolioIcon,
} from '../icons'
import { PAGE_SECTION_TYPE_VALUES, PAGE_SECTION_TYPE_LABELS, PAGE_SECTION_TYPE_DESCRIPTIONS, type PageSectionType } from '../../types/page'

const SECTION_ICONS: Record<PageSectionType, ComponentType<{ size?: number }>> = {
  slider: SliderIcon,
  banner: BannerIcon,
  text: DocumentPlainIcon,
  cards: CardsIcon,
  tabs: TabsIcon,
  accordion: AccordionIcon,
  faq: FaqIcon,
  carousel: CarouselIcon,
  image: ImageOnlyIcon,
  pricing: TagIcon,
  steps: StepsIcon,
  team: UsersIcon,
  quotation: QuotationIcon,
  testimonial: TestimonialIcon,
  review: ReviewIcon,
  video: VideoOnlyIcon,
  chart: ChartIcon,
  gallery: ImageGalleryIcon,
  cta: CtaIcon,
  statistics: StatIcon,
  timeline: TimelineIcon,
  map: MapIcon,
  portfolio: PortfolioIcon,
}

export default function PageSectionTypePicker({ onPick }: { onPick: (type: PageSectionType) => void }) {
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
          className="absolute right-0 z-20 mt-2 p-3 rounded-2xl shadow-2xl grid grid-cols-2 gap-1.5 w-[30rem] max-h-[28rem] overflow-y-auto"
          style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
        >
          {PAGE_SECTION_TYPE_VALUES.map((type) => {
            const Icon = SECTION_ICONS[type]
            return (
              <button
                key={type}
                type="button"
                onClick={() => {
                  onPick(type)
                  setOpen(false)
                }}
                className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition"
                onMouseEnter={(e) => (e.currentTarget.style.background = theme.surfaceHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span className="mt-0.5 shrink-0" style={{ color: theme.accent }}>
                  <Icon size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium" style={{ color: theme.textPrimary }}>
                    {PAGE_SECTION_TYPE_LABELS[type]}
                  </span>
                  <span className="block text-xs mt-0.5" style={{ color: theme.textTertiary }}>
                    {PAGE_SECTION_TYPE_DESCRIPTIONS[type]}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

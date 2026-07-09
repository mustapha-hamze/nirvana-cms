import { useState, useRef, useEffect, useLayoutEffect, useCallback, type ComponentType } from 'react'
import { createPortal } from 'react-dom'
import { theme } from '../../theme'
import {
  PlusIcon, SliderIcon, BannerIcon, DocumentPlainIcon, CardsIcon, TabsIcon, AccordionIcon, FaqIcon,
  CarouselIcon, ImageOnlyIcon, TagIcon, StepsIcon, UsersIcon, QuotationIcon, TestimonialIcon, ReviewIcon,
  VideoOnlyIcon, ChartIcon, ImageGalleryIcon, CtaIcon, StatIcon, TimelineIcon, MapIcon, PortfolioIcon,
  ImageTextIcon, HeadingIcon, LinkIcon,
} from '../icons'
import type { PageComponentType } from '../../types/page'
import { PAGE_COMPONENT_TYPE_VALUES, PAGE_COMPONENT_TYPE_LABELS, PAGE_COMPONENT_TYPE_DESCRIPTIONS } from '../../constants/pageSections'

const COMPONENT_ICONS: Record<PageComponentType, ComponentType<{ size?: number }>> = {
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
  feature: ImageTextIcon,
  heading: HeadingIcon,
  link: LinkIcon,
}

const MENU_WIDTH = 480 // matches the old w-[30rem]
const MENU_MAX_HEIGHT = 448 // matches the old max-h-[28rem]
const GAP = 8

// Picks a component TYPE to add into a section — what used to be
// PageSectionTypePicker (picking a whole section's type) before sections
// became generic containers a picker of this same catalog now fills with one
// or more components instead.
export default function PageComponentTypePicker({
  onPick,
  label = 'Add Component',
}: {
  onPick: (type: PageComponentType) => void
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; maxHeight: number } | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Positions the menu against the trigger button with `position: fixed` —
  // this button can sit anywhere in a long page-editor form, and ancestor
  // cards clip overflow for their rounded corners, so a plain CSS-anchored
  // absolute dropdown gets cut off whichever way it opens. Portaling to
  // <body> with a measured position escapes that clipping and lets it flip
  // to whichever side (above/below) has more room.
  const computeMenuStyle = useCallback(() => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom - GAP
    const spaceAbove = rect.top - GAP
    const openUpward = spaceBelow < MENU_MAX_HEIGHT && spaceAbove > spaceBelow
    const maxHeight = Math.min(MENU_MAX_HEIGHT, Math.max(openUpward ? spaceAbove : spaceBelow, 200))
    setMenuStyle({
      top: openUpward ? rect.top - GAP - maxHeight : rect.bottom + GAP,
      left: Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - GAP),
      maxHeight,
    })
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    computeMenuStyle()
  }, [open, computeMenuStyle])

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (wrapperRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setOpen(false)
    }
    // Reposition (not close) on scroll — this button often sits at the
    // bottom of a list, at or near the viewport edge, so simply opening it
    // can itself trigger a browser focus-scroll adjustment; treating that as
    // "the user scrolled away" would close the menu the instant it opens.
    // Recomputing position keeps it correctly anchored to the button through
    // any real scrolling too, without the false-close.
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', computeMenuStyle, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', computeMenuStyle, true)
    }
  }, [open, computeMenuStyle])

  return (
    <div className="relative inline-block" ref={wrapperRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97]"
        style={{ background: theme.accentGradient, boxShadow: '0 2px 16px rgba(124,58,237,0.35)' }}
      >
        <PlusIcon />
        {label}
      </button>
      {open && menuStyle && createPortal(
        <div
          ref={menuRef}
          className="fixed z-50 p-3 rounded-2xl shadow-2xl grid grid-cols-2 gap-1.5 overflow-y-auto"
          style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            top: menuStyle.top,
            left: menuStyle.left,
            width: MENU_WIDTH,
            maxHeight: menuStyle.maxHeight,
          }}
        >
          {PAGE_COMPONENT_TYPE_VALUES.map((type) => {
            const Icon = COMPONENT_ICONS[type]
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
                    {PAGE_COMPONENT_TYPE_LABELS[type]}
                  </span>
                  <span className="block text-xs mt-0.5" style={{ color: theme.textTertiary }}>
                    {PAGE_COMPONENT_TYPE_DESCRIPTIONS[type]}
                  </span>
                </span>
              </button>
            )
          })}
        </div>,
        document.body,
      )}
    </div>
  )
}

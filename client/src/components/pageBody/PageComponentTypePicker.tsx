import type { ComponentType } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import {
  PlusIcon, SliderIcon, BannerIcon, DocumentPlainIcon, CardsIcon, TabsIcon, AccordionIcon, FaqIcon,
  CarouselIcon, ImageOnlyIcon, TagIcon, StepsIcon, UsersIcon, QuotationIcon, TestimonialIcon, ReviewIcon,
  VideoOnlyIcon, ChartIcon, ImageGalleryIcon, CtaIcon, StatIcon, TimelineIcon, MapIcon, PortfolioIcon,
  ImageTextIcon, HeadingIcon, LinkIcon,
} from '../icons'
import type { PageComponentType } from '../../types/page'
import { PAGE_COMPONENT_TYPE_VALUES, PAGE_COMPONENT_TYPE_KEYS, PAGE_COMPONENT_TYPE_DESCRIPTION_KEYS } from '../../constants/pageSections'
import { useLocale } from '../../i18n/useLocale'

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

// Picks a component TYPE to add into a section — what used to be
// PageSectionTypePicker (picking a whole section's type) before sections
// became generic containers a picker of this same catalog now fills with one
// or more components instead.
export default function PageComponentTypePicker({
  onPick,
  label,
}: {
  onPick: (type: PageComponentType) => void
  label?: string
}) {
  const { t } = useLocale()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button">
          <PlusIcon />
          {label ?? t('pageBuilder.addComponent')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="grid max-h-[28rem] w-[30rem] grid-cols-2 gap-1.5 overflow-y-auto p-3">
        {PAGE_COMPONENT_TYPE_VALUES.map((type) => {
          const Icon = COMPONENT_ICONS[type]
          return (
            <DropdownMenuItem
              key={type}
              onClick={() => onPick(type)}
              className="items-start gap-2.5 rounded-xl px-3 py-2.5 text-start"
            >
              <span className="mt-0.5 shrink-0 text-primary">
                <Icon size={18} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">
                  {t(PAGE_COMPONENT_TYPE_KEYS[type])}
                </span>
                <span className="block text-xs mt-0.5 text-(--color-text-tertiary)">
                  {t(PAGE_COMPONENT_TYPE_DESCRIPTION_KEYS[type])}
                </span>
              </span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

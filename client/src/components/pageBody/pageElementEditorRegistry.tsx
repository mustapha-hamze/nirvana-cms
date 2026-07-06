import type { PageElement } from '../../types/page'
import RichTextElementEditor from './RichTextElementEditor'
import ImageElementEditor from './ImageElementEditor'
import VideoEmbedElementEditor from './VideoEmbedElementEditor'
import SlideElementEditor from './SlideElementEditor'
import BannerElementEditor from './BannerElementEditor'
import CardElementEditor from './CardElementEditor'
import TabElementEditor from './TabElementEditor'
import AccordionItemElementEditor from './AccordionItemElementEditor'
import CarouselItemElementEditor from './CarouselItemElementEditor'
import PricingPlanElementEditor from './PricingPlanElementEditor'
import StepElementEditor from './StepElementEditor'
import TeamMemberElementEditor from './TeamMemberElementEditor'
import TestimonialItemElementEditor from './TestimonialItemElementEditor'
import ChartDataElementEditor from './ChartDataElementEditor'
import GalleryItemElementEditor from './GalleryItemElementEditor'
import CtaElementEditor from './CtaElementEditor'
import StatItemElementEditor from './StatItemElementEditor'
import TimelineItemElementEditor from './TimelineItemElementEditor'
import MapElementEditor from './MapElementEditor'
import PortfolioItemElementEditor from './PortfolioItemElementEditor'

// Dispatches to the right per-type editor based on the discriminated union's
// `elementType` tag, so PageSectionCard doesn't need its own switch statement
// — same convention as body/elementEditorRegistry.tsx for Content.
export function PageElementEditor({
  applicationId,
  element,
  onChange,
}: {
  applicationId: string
  element: PageElement
  onChange: (next: PageElement) => void
}) {
  switch (element.elementType) {
    case 'richText':
      return <RichTextElementEditor element={element} onChange={onChange} />
    case 'image':
      return <ImageElementEditor applicationId={applicationId} element={element} onChange={onChange} />
    case 'videoEmbed':
      return <VideoEmbedElementEditor element={element} onChange={onChange} />
    case 'slide':
      return <SlideElementEditor applicationId={applicationId} element={element} onChange={onChange} />
    case 'banner':
      return <BannerElementEditor applicationId={applicationId} element={element} onChange={onChange} />
    case 'card':
      return <CardElementEditor applicationId={applicationId} element={element} onChange={onChange} />
    case 'tab':
      return <TabElementEditor element={element} onChange={onChange} />
    case 'accordionItem':
      return <AccordionItemElementEditor element={element} onChange={onChange} />
    case 'carouselItem':
      return <CarouselItemElementEditor applicationId={applicationId} element={element} onChange={onChange} />
    case 'pricingPlan':
      return <PricingPlanElementEditor element={element} onChange={onChange} />
    case 'step':
      return <StepElementEditor applicationId={applicationId} element={element} onChange={onChange} />
    case 'teamMember':
      return <TeamMemberElementEditor applicationId={applicationId} element={element} onChange={onChange} />
    case 'testimonialItem':
      return <TestimonialItemElementEditor applicationId={applicationId} element={element} onChange={onChange} />
    case 'chartData':
      return <ChartDataElementEditor element={element} onChange={onChange} />
    case 'galleryItem':
      return <GalleryItemElementEditor applicationId={applicationId} element={element} onChange={onChange} />
    case 'cta':
      return <CtaElementEditor element={element} onChange={onChange} />
    case 'statItem':
      return <StatItemElementEditor applicationId={applicationId} element={element} onChange={onChange} />
    case 'timelineItem':
      return <TimelineItemElementEditor element={element} onChange={onChange} />
    case 'map':
      return <MapElementEditor element={element} onChange={onChange} />
    case 'portfolioItem':
      return <PortfolioItemElementEditor applicationId={applicationId} element={element} onChange={onChange} />
  }
}

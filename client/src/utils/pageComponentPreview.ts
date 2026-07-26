import type { PageComponent, PageElement } from '../types/page'

const MAX_PREVIEW_LENGTH = 70

// Best-effort human-readable snippet for one element — whichever field reads
// as its "title" to an editor scanning a collapsed component list.
function previewForElement(element: PageElement): string {
  switch (element.elementType) {
    case 'richText':
      return element.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    case 'image':
      return element.alt || element.caption || ''
    case 'videoEmbed':
      return element.caption || element.url
    case 'slide':
    case 'banner':
    case 'cta':
      return element.heading || element.subheading
    case 'card':
      return element.title || element.description
    case 'tab':
      return element.label
    case 'accordionItem':
      return element.heading
    case 'carouselItem':
      return element.caption
    case 'pricingPlan':
      return element.name
    case 'step':
      return element.title
    case 'teamMember':
      return element.name || element.role
    case 'testimonialItem':
      return element.authorName || element.quote
    case 'chartData':
      return element.title
    case 'galleryItem':
      return element.caption || element.fileName || element.alt
    case 'statItem':
      return element.label || element.value
    case 'timelineItem':
      return element.title
    case 'map':
      return element.address
    case 'portfolioItem':
      return element.title
    case 'feature':
      return element.heading
    case 'heading':
      return element.text
    case 'link':
      return element.label || element.url
    default:
      return ''
  }
}

// Short snippet shown in a collapsed PageComponentCard header so an editor
// can tell components apart (e.g. which "Heading" is which) without opening
// each one. Joins up to two elements' previews, truncated to fit a header row.
export function getPageComponentPreview(component: PageComponent): string {
  const parts = component.elements.map(previewForElement).map((s) => s.trim()).filter(Boolean)
  if (parts.length === 0) return ''
  const joined = parts.slice(0, 2).join(' · ')
  return joined.length > MAX_PREVIEW_LENGTH ? `${joined.slice(0, MAX_PREVIEW_LENGTH - 1)}…` : joined
}

import type { ContentElement } from '../../types/content'
import ParagraphElementEditor from './ParagraphElementEditor'
import RichTextElementEditor from './RichTextElementEditor'
import HeadingElementEditor from './HeadingElementEditor'
import TextInputElementEditor from './TextInputElementEditor'
import ImageElementEditor from './ImageElementEditor'
import ImageGalleryElementEditor from './ImageGalleryElementEditor'
import LinkElementEditor from './LinkElementEditor'
import VideoEmbedElementEditor from './VideoEmbedElementEditor'

// Dispatches to the right per-type editor based on the discriminated union's
// `elementType` tag, so SectionCard doesn't need its own switch statement.
export function ElementEditor({
  applicationId,
  element,
  onChange,
}: {
  applicationId: string
  element: ContentElement
  onChange: (next: ContentElement) => void
}) {
  switch (element.elementType) {
    case 'paragraph':
      return <ParagraphElementEditor element={element} onChange={onChange} />
    case 'richText':
      return <RichTextElementEditor element={element} onChange={onChange} />
    case 'heading':
      return <HeadingElementEditor element={element} onChange={onChange} />
    case 'textInput':
      return <TextInputElementEditor element={element} onChange={onChange} />
    case 'image':
      return <ImageElementEditor applicationId={applicationId} element={element} onChange={onChange} />
    case 'imageGallery':
      return <ImageGalleryElementEditor applicationId={applicationId} element={element} onChange={onChange} />
    case 'link':
      return <LinkElementEditor element={element} onChange={onChange} />
    case 'videoEmbed':
      return <VideoEmbedElementEditor element={element} onChange={onChange} />
  }
}

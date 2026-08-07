import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DragHandleIcon, TrashIcon } from '../icons'
import { ElementEditor } from './elementEditorRegistry'
import type { ContentSection, ContentElement, ElementType } from '../../types/content'
import { SECTION_TYPE_KEYS, ELEMENT_TYPE_KEYS, getSlotElementTypes } from '../../constants/contentSections'
import { convertElementType } from '../../factories/contentElements'
import { useLocale } from '../../i18n/useLocale'

export default function SectionCard({
  id,
  applicationId,
  section,
  onChange,
  onRemove,
}: {
  id: string
  applicationId: string
  section: ContentSection
  onChange: (next: ContentSection) => void
  onRemove: () => void
}) {
  const { t } = useLocale()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  function updateElement(index: number, next: ContentElement) {
    const elements = section.elements.slice()
    elements[index] = next
    onChange({ ...section, elements })
  }

  function changeElementType(index: number, elementType: ElementType) {
    const elements = section.elements.slice()
    elements[index] = convertElementType(elements[index], elementType)
    onChange({ ...section, elements })
  }

  // Two-element layouts (text+image, two images, text+video, ...) sit
  // side by side; single-element layouts just stack.
  const layoutClass = section.elements.length === 2 ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="rounded-2xl border bg-card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <button type="button" {...attributes} {...listeners} className="cursor-grab touch-none text-(--color-text-tertiary)">
            <DragHandleIcon />
          </button>
          <Badge variant="accent" className="text-xs font-semibold">
            {t(SECTION_TYPE_KEYS[section.type])}
          </Badge>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          title={t('contentBuilder.removeSection')}
          className="icon-btn-danger hover:bg-transparent"
        >
          <TrashIcon size={14} />
        </Button>
      </div>
      <div className={layoutClass}>
        {section.elements.map((element, i) => {
          const allowedTypes = getSlotElementTypes(section.type, i)
          return (
            <div key={i} className="space-y-2">
              {allowedTypes.length > 1 && (
                <div className="flex flex-wrap gap-1.5">
                  {allowedTypes.map((elType) => {
                    const active = elType === element.elementType
                    return (
                      <Button
                        key={elType}
                        type="button"
                        variant={active ? 'default' : 'outline'}
                        size="sm"
                        className="h-auto rounded-full px-2.5 py-1 text-xs"
                        onClick={() => changeElementType(i, elType)}
                      >
                        {t(ELEMENT_TYPE_KEYS[elType])}
                      </Button>
                    )
                  })}
                </div>
              )}
              <ElementEditor applicationId={applicationId} element={element} onChange={(next) => updateElement(i, next)} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

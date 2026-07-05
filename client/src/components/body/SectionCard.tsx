import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { theme } from '../../theme'
import { DragHandleIcon, TrashIcon } from '../icons'
import { ElementEditor } from './elementEditorRegistry'
import {
  SECTION_TYPE_LABELS, ELEMENT_TYPE_LABELS, getSlotElementTypes, convertElementType,
  type ContentSection, type ContentElement, type ElementType,
} from '../../types/content'

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
        background: theme.surface,
        border: `1px solid ${theme.border}`,
      }}
      className="rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <button type="button" {...attributes} {...listeners} className="cursor-grab touch-none" style={{ color: theme.textTertiary }}>
            <DragHandleIcon />
          </button>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: theme.accentBg, color: theme.accent }}>
            {SECTION_TYPE_LABELS[section.type]}
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          title="Remove section"
          className="p-1.5 rounded-lg transition"
          style={{ color: theme.danger }}
          onMouseEnter={(e) => (e.currentTarget.style.background = theme.dangerBgHover)}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <TrashIcon size={14} />
        </button>
      </div>
      <div className={layoutClass}>
        {section.elements.map((element, i) => {
          const allowedTypes = getSlotElementTypes(section.type, i)
          return (
            <div key={i} className="space-y-2">
              {allowedTypes.length > 1 && (
                <div className="flex flex-wrap gap-1.5">
                  {allowedTypes.map((t) => {
                    const active = t === element.elementType
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => changeElementType(i, t)}
                        className="px-2.5 py-1 rounded-full text-xs font-medium transition"
                        style={active
                          ? { background: theme.accentBg, color: theme.accent }
                          : { background: theme.inputBg, color: theme.textSecondary, border: `1px solid ${theme.inputBorder}` }
                        }
                      >
                        {ELEMENT_TYPE_LABELS[t]}
                      </button>
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

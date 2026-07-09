import { useState } from 'react'
import { useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { theme } from '../../theme'
import { PlusIcon } from '../icons'
import PageComponentCardHeader from './PageComponentCardHeader'
import SortablePageElementList from './SortablePageElementList'
import PageElementRow from './PageElementRow'
import { useStableSortableIds } from '../../hooks/useStableSortableIds'
import { PAGE_COMPONENT_LAYOUTS, PAGE_ELEMENT_TYPE_LABELS } from '../../constants/pageSections'
import { createEmptyElementOfType } from '../../factories/pageElements'
import type { PageComponent, PageElement, PageComponentType } from '../../types/page'

// Component types whose items are short, uniform tiles (cards, slides,
// gallery items) — stacked one-per-row they turn into a very long scroll
// once an editor adds more than a handful, so their items lay out four to a
// row instead. Purely an admin-editor presentation choice.
const GRID_LAYOUT_COMPONENT_TYPES = new Set<PageComponentType>(['cards', 'slider', 'gallery'])

// One component within a section — the direct analogue of what
// PageSectionCard used to render before sections became generic containers:
// a type-specific, homogeneous list of elements, with its own drag handle,
// element list, and "Add {item}" button. No title/settings/visibility here
// — those live one level up, on the section itself.
export default function PageComponentCard({
  id,
  applicationId,
  component,
  onChange,
  onRemove,
}: {
  id: string
  applicationId: string
  component: PageComponent
  onChange: (next: PageComponent) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const layout = PAGE_COMPONENT_LAYOUTS[component.type]
  const itemLabel = PAGE_ELEMENT_TYPE_LABELS[layout.elementType]
  // UI-only, never persisted — same rationale as PageSectionCard's `open`:
  // defaults closed so a section with several components loads as a
  // scannable list of headers rather than every component's editor at once.
  const [open, setOpen] = useState(false)

  const idsRef = useStableSortableIds(component.elements.length)
  const ids = idsRef.current

  function updateElement(index: number, next: PageElement) {
    const elements = component.elements.slice()
    elements[index] = next
    onChange({ ...component, elements })
  }

  function removeElement(index: number) {
    if (component.elements.length <= layout.min) return
    idsRef.current = idsRef.current.filter((_, i) => i !== index)
    onChange({ ...component, elements: component.elements.filter((_, i) => i !== index) })
  }

  function addElement() {
    if (component.elements.length >= layout.max) return
    idsRef.current = [...idsRef.current, crypto.randomUUID()]
    onChange({ ...component, elements: [...component.elements, createEmptyElementOfType(layout.elementType)] })
  }

  function reorderElements(oldIndex: number, newIndex: number) {
    idsRef.current = arrayMove(ids, oldIndex, newIndex)
    onChange({ ...component, elements: arrayMove(component.elements, oldIndex, newIndex) })
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        background: theme.inputBg,
        border: `1px solid ${theme.inputBorder}`,
      }}
      className="rounded-xl p-4"
    >
      <PageComponentCardHeader
        component={component}
        elementCount={component.elements.length}
        maxElements={layout.max}
        dragHandleProps={{ attributes, listeners }}
        open={open}
        onToggleOpen={() => setOpen((v) => !v)}
        onRemove={onRemove}
      />

      {open && (
        <div className="mt-3">
          <SortablePageElementList
            ids={ids}
            onReorder={reorderElements}
            layout={GRID_LAYOUT_COMPONENT_TYPES.has(component.type) ? 'grid' : 'list'}
            renderRow={(rowId, i) => (
              <PageElementRow
                key={rowId}
                id={rowId}
                applicationId={applicationId}
                index={i}
                itemLabel={itemLabel}
                element={component.elements[i]}
                onChange={(next) => updateElement(i, next)}
                onRemove={() => removeElement(i)}
                canRemove={component.elements.length > layout.min}
              />
            )}
          />

          {component.elements.length < layout.max && (
            <button
              type="button"
              onClick={addElement}
              className="flex items-center gap-1.5 text-sm font-medium transition mt-3"
              style={{ color: theme.accent }}
            >
              <PlusIcon size={14} /> Add {itemLabel.toLowerCase()}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

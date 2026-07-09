import type { ReactNode } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'

// Shared drag-to-reorder list for a form's top-level sections — used by both
// ContentForm's Body and PageForm's Sections, which otherwise each set up an
// identical DndContext/SortableContext/sensors trio. Assumes each section
// already carries a stable id (both editors' section types have a `cid`);
// PageSectionCard's own element rows don't have one, so that one keeps its
// own sortable list (see useStableSortableIds) rather than using this.
export default function SortableSectionList<TSection>({
  sections,
  getId,
  onReorder,
  renderSection,
}: {
  sections: TSection[]
  getId: (section: TSection) => string
  onReorder: (next: TSection[]) => void
  renderSection: (section: TSection, index: number) => ReactNode
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))
  const ids = sections.map(getId)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    onReorder(arrayMove(sections, oldIndex, newIndex))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {sections.map((section, i) => renderSection(section, i))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

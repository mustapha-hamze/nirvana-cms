import type { ReactNode } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable'

// Drag-to-reorder list for a PageSectionCard's element rows. Unlike
// ui/SortableSectionList (which derives dnd-kit ids from each section's own
// `cid`), PageElement carries no persistent id, so the ids here come from
// useStableSortableIds instead and must be reordered in lockstep by the
// caller alongside the elements array itself.
export default function SortablePageElementList({
  ids,
  onReorder,
  renderRow,
  layout = 'list',
}: {
  ids: string[]
  onReorder: (oldIndex: number, newIndex: number) => void
  renderRow: (id: string, index: number) => ReactNode
  // 'grid' is for section types whose items are short, uniform tiles (cards,
  // slides, gallery items) — many of those stacked full-width one-per-row
  // makes for a very long scroll, so they lay out four to a row instead.
  // Needs dnd-kit's rect (not vertical-list) strategy to drag sensibly in 2D.
  layout?: 'list' | 'grid'
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    onReorder(oldIndex, newIndex)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={layout === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}>
        <div className={layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3' : 'space-y-3'}>
          {ids.map((id, i) => renderRow(id, i))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

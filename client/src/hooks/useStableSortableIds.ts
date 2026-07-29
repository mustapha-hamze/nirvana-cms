import { useRef } from 'react'
import { randomUUID } from '@/utils/randomUUID'

// Stable per-row ids for dnd-kit, decoupled from array index/content — needed
// wherever the sortable items themselves carry no persistent id (PageElement
// has none, unlike PageSection's `cid`). Same approach as
// body/ImageGalleryElementEditor.tsx. Callers that add/remove/reorder items
// must keep `idsRef.current` in lockstep with their own array in the same
// operation (see PageSectionCard's updateElement/removeElement/addElement).
export function useStableSortableIds(count: number) {
  const idsRef = useRef<string[]>(Array.from({ length: count }, () => randomUUID()))
  while (idsRef.current.length < count) idsRef.current.push(randomUUID())
  if (idsRef.current.length > count) idsRef.current.length = count
  return idsRef
}

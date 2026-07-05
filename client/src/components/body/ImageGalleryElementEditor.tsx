import { useRef } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TextField } from '../ui/FormField'
import { theme } from '../../theme'
import { DragHandleIcon, TrashIcon, PlusIcon } from '../icons'
import ImageUploadField from './ImageUploadField'
import type { ImageGalleryElement, GalleryImage } from '../../types/content'

const MIN_IMAGES = 2

function GalleryRow({
  id,
  applicationId,
  image,
  onChange,
  onRemove,
  canRemove,
}: {
  id: string
  applicationId: string
  image: GalleryImage
  onChange: (next: GalleryImage) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, border: `1px solid ${theme.inputBorder}` }}
      className="flex items-start gap-2 p-3 rounded-xl"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="mt-2.5 cursor-grab touch-none shrink-0"
        style={{ color: theme.textTertiary }}
      >
        <DragHandleIcon />
      </button>
      <div className="flex-1 space-y-2 min-w-0">
        <ImageUploadField applicationId={applicationId} url={image.url} onUploaded={(url) => onChange({ ...image, url })} />
        <TextField label="Alt text" required value={image.alt} onChange={(alt) => onChange({ ...image, alt })} />
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        title={canRemove ? 'Remove image' : `A gallery needs at least ${MIN_IMAGES} images`}
        className="mt-2.5 p-1.5 rounded-lg transition disabled:opacity-30 shrink-0"
        style={{ color: theme.danger }}
      >
        <TrashIcon size={14} />
      </button>
    </div>
  )
}

export default function ImageGalleryElementEditor({
  applicationId,
  element,
  onChange,
}: {
  applicationId: string
  element: ImageGalleryElement
  onChange: (next: ImageGalleryElement) => void
}) {
  // Stable per-row ids for dnd-kit, decoupled from array index. Mutated (not
  // via setState) alongside `element.images` since the parent already owns
  // re-rendering through `onChange` — this ref just keeps ids in sync with it.
  const idsRef = useRef<string[]>(element.images.map(() => crypto.randomUUID()))
  while (idsRef.current.length < element.images.length) idsRef.current.push(crypto.randomUUID())
  if (idsRef.current.length > element.images.length) idsRef.current.length = element.images.length
  const ids = idsRef.current

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  function updateImage(index: number, next: GalleryImage) {
    const images = element.images.slice()
    images[index] = next
    onChange({ ...element, images })
  }

  function removeImage(index: number) {
    if (element.images.length <= MIN_IMAGES) return
    idsRef.current = idsRef.current.filter((_, i) => i !== index)
    onChange({ ...element, images: element.images.filter((_, i) => i !== index) })
  }

  function addImage() {
    idsRef.current = [...idsRef.current, crypto.randomUUID()]
    onChange({ ...element, images: [...element.images, { url: '', alt: '', caption: '' }] })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    idsRef.current = arrayMove(ids, oldIndex, newIndex)
    onChange({ ...element, images: arrayMove(element.images, oldIndex, newIndex) })
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium mb-1" style={{ color: theme.textSecondary }}>
        Gallery Images ({element.images.length})
      </label>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {element.images.map((image, i) => (
              <GalleryRow
                key={ids[i]}
                id={ids[i]}
                applicationId={applicationId}
                image={image}
                onChange={(next) => updateImage(i, next)}
                onRemove={() => removeImage(i)}
                canRemove={element.images.length > MIN_IMAGES}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <button type="button" onClick={addImage} className="flex items-center gap-1.5 text-sm font-medium transition" style={{ color: theme.accent }}>
        <PlusIcon size={14} /> Add Image
      </button>
    </div>
  )
}

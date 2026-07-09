import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { theme } from '../../theme'
import { DragHandleIcon, TrashIcon } from '../icons'
import { PageElementEditor } from './pageElementEditorRegistry'
import type { PageElement } from '../../types/page'

// One draggable row within a PageSectionCard's element list — the drag
// handle/label/remove chrome around whichever per-type editor
// PageElementEditor dispatches to.
export default function PageElementRow({
  id,
  applicationId,
  index,
  itemLabel,
  element,
  onChange,
  onRemove,
  canRemove,
}: {
  id: string
  applicationId: string
  index: number
  itemLabel: string
  element: PageElement
  onChange: (next: PageElement) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

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
      className="rounded-xl p-4 h-full"
    >
      <div className="flex items-center gap-2 mb-3">
        <button type="button" {...attributes} {...listeners} className="cursor-grab touch-none shrink-0" style={{ color: theme.textTertiary }}>
          <DragHandleIcon />
        </button>
        <span className="text-xs font-semibold flex-1" style={{ color: theme.textSecondary }}>
          {itemLabel} {index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          title={canRemove ? `Remove this ${itemLabel.toLowerCase()}` : 'This section is already at its minimum'}
          className="p-1.5 rounded-lg transition disabled:opacity-30 shrink-0"
          style={{ color: theme.danger }}
        >
          <TrashIcon size={14} />
        </button>
      </div>
      <PageElementEditor applicationId={applicationId} element={element} onChange={onChange} />
    </div>
  )
}

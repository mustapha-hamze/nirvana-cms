import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { DragHandleIcon, TrashIcon } from '../icons'
import { PageElementEditor } from './pageElementEditorRegistry'
import { useLocale } from '../../i18n/useLocale'
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
  const { t } = useLocale()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="rounded-xl border bg-input/30 p-4 h-full"
    >
      <div className="flex items-center gap-2 mb-3">
        <button type="button" {...attributes} {...listeners} className="cursor-grab touch-none shrink-0 text-(--color-text-tertiary)">
          <DragHandleIcon />
        </button>
        <span className="text-xs font-semibold flex-1 text-muted-foreground">
          {itemLabel} {index + 1}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          disabled={!canRemove}
          title={canRemove ? t('pageBuilder.removeItemTitle', { item: itemLabel.toLowerCase() }) : t('pageBuilder.minimumReached')}
          className="icon-btn-danger shrink-0 hover:bg-transparent"
        >
          <TrashIcon size={14} />
        </Button>
      </div>
      <PageElementEditor applicationId={applicationId} element={element} onChange={onChange} />
    </div>
  )
}

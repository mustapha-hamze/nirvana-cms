import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core'
import { Button } from '@/components/ui/button'
import { ChevronIcon, DragHandleIcon, TrashIcon } from '../icons'
import { PAGE_COMPONENT_TYPE_LABELS } from '../../constants/pageSections'
import { getPageComponentPreview } from '../../utils/pageComponentPreview'
import type { PageComponent } from '../../types/page'

// Header for one component within a section — the component's type is its
// primary label here (there's no separate component-level title; that lives
// one level up, on the section). No settings/visibility controls — those
// stay section-level only.
export default function PageComponentCardHeader({
  component,
  elementCount,
  maxElements,
  dragHandleProps,
  open,
  onToggleOpen,
  onRemove,
}: {
  component: PageComponent
  elementCount: number
  maxElements: number
  dragHandleProps: { attributes: DraggableAttributes; listeners: DraggableSyntheticListeners }
  open: boolean
  onToggleOpen: () => void
  onRemove: () => void
}) {
  // Only shown collapsed — once open, the actual editors below make this redundant.
  const preview = open ? '' : getPageComponentPreview(component)

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 flex-wrap min-w-0">
        <button
          type="button"
          {...dragHandleProps.attributes}
          {...dragHandleProps.listeners}
          className="cursor-grab touch-none shrink-0 text-(--color-text-tertiary)"
        >
          <DragHandleIcon size={14} />
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={onToggleOpen}
          title={open ? 'Collapse this component' : 'Expand this component'}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <ChevronIcon open={open} size={14} />
        </Button>
        <span className="text-sm font-semibold shrink-0 text-foreground">
          {PAGE_COMPONENT_TYPE_LABELS[component.type]}
        </span>
        <span className="text-xs shrink-0 text-(--color-text-tertiary)">
          {elementCount} / {maxElements}
        </span>
        {preview && (
          <span className="text-xs truncate text-(--color-text-tertiary)">
            — {preview}
          </span>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onRemove}
        title="Remove this component"
        className="icon-btn-danger shrink-0 hover:bg-transparent"
      >
        <TrashIcon size={14} />
      </Button>
    </div>
  )
}

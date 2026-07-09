import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core'
import { theme } from '../../theme'
import { ChevronIcon, DragHandleIcon, TrashIcon } from '../icons'
import { PAGE_COMPONENT_TYPE_LABELS } from '../../constants/pageSections'
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
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 flex-wrap min-w-0">
        <button
          type="button"
          {...dragHandleProps.attributes}
          {...dragHandleProps.listeners}
          className="cursor-grab touch-none shrink-0"
          style={{ color: theme.textTertiary }}
        >
          <DragHandleIcon size={14} />
        </button>
        <button
          type="button"
          onClick={onToggleOpen}
          title={open ? 'Collapse this component' : 'Expand this component'}
          className="p-1 rounded-lg transition shrink-0"
          style={{ color: theme.textTertiary }}
          onMouseEnter={(e) => (e.currentTarget.style.color = theme.textPrimary)}
          onMouseLeave={(e) => (e.currentTarget.style.color = theme.textTertiary)}
        >
          <ChevronIcon open={open} size={14} />
        </button>
        <span className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
          {PAGE_COMPONENT_TYPE_LABELS[component.type]}
        </span>
        <span className="text-xs shrink-0" style={{ color: theme.textTertiary }}>
          {elementCount} / {maxElements}
        </span>
      </div>
      <button
        type="button"
        onClick={onRemove}
        title="Remove this component"
        className="p-1.5 rounded-lg transition shrink-0"
        style={{ color: theme.danger }}
        onMouseEnter={(e) => (e.currentTarget.style.background = theme.dangerBgHover)}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <TrashIcon size={14} />
      </button>
    </div>
  )
}

import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronIcon, DragHandleIcon, TrashIcon, EyeIcon, EyeOffIcon, GearIcon } from '../icons'
import { getTextDirection, getRtlAwareClassName } from '../../utils/rtl'
import type { PageSection } from '../../types/page'

// Header bar for a PageSectionCard — drag handle, collapse toggle, the
// section's own title (its only label now; a section carries no type of its
// own — see PageSection), a hidden badge, how many components it holds, and
// the settings/visibility/remove buttons.
export default function PageSectionCardHeader({
  section,
  componentCount,
  dragHandleProps,
  open,
  onToggleOpen,
  settingsOpen,
  onToggleSettings,
  onToggleVisibility,
  onRemove,
}: {
  section: PageSection
  componentCount: number
  dragHandleProps: { attributes: DraggableAttributes; listeners: DraggableSyntheticListeners }
  open: boolean
  onToggleOpen: () => void
  settingsOpen: boolean
  onToggleSettings: () => void
  onToggleVisibility: () => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 flex-wrap min-w-0">
        <button
          type="button"
          {...dragHandleProps.attributes}
          {...dragHandleProps.listeners}
          className="cursor-grab touch-none shrink-0 text-(--color-text-tertiary)"
        >
          <DragHandleIcon />
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={onToggleOpen}
          title={open ? 'Collapse this section' : 'Expand this section'}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <ChevronIcon open={open} size={16} />
        </Button>
        <span
          dir={getTextDirection(section.title)}
          className={cn('text-sm font-semibold text-foreground', getRtlAwareClassName(section.title))}
        >
          {section.title || 'Untitled section'}
        </span>
        {!section.isVisible && (
          <Badge variant="neutral" className="shrink-0 text-xs font-semibold">
            Hidden
          </Badge>
        )}
        <span className="text-xs shrink-0 text-(--color-text-tertiary)">
          {componentCount === 1 ? '1 component' : `${componentCount} components`}
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onToggleSettings}
          title="Section settings"
          className={settingsOpen ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'}
        >
          <GearIcon size={15} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onToggleVisibility}
          title={section.isVisible ? 'Hide this section' : 'Show this section'}
          className="text-muted-foreground hover:text-foreground"
        >
          {section.isVisible ? <EyeIcon size={16} /> : <EyeOffIcon size={16} />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          title="Remove section"
          className="icon-btn-danger hover:bg-transparent"
        >
          <TrashIcon size={14} />
        </Button>
      </div>
    </div>
  )
}

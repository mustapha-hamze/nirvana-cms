import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core'
import { theme } from '../../theme'
import { ChevronIcon, DragHandleIcon, TrashIcon, EyeIcon, EyeOffIcon, GearIcon } from '../icons'
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
          className="cursor-grab touch-none shrink-0"
          style={{ color: theme.textTertiary }}
        >
          <DragHandleIcon />
        </button>
        <button
          type="button"
          onClick={onToggleOpen}
          title={open ? 'Collapse this section' : 'Expand this section'}
          className="p-1 rounded-lg transition shrink-0"
          style={{ color: theme.textTertiary }}
          onMouseEnter={(e) => (e.currentTarget.style.color = theme.textPrimary)}
          onMouseLeave={(e) => (e.currentTarget.style.color = theme.textTertiary)}
        >
          <ChevronIcon open={open} size={16} />
        </button>
        <span className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
          {section.title || 'Untitled section'}
        </span>
        {!section.isVisible && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0" style={{ background: theme.hoverBgSubtle, color: theme.textTertiary }}>
            Hidden
          </span>
        )}
        <span className="text-xs shrink-0" style={{ color: theme.textTertiary }}>
          {componentCount === 1 ? '1 component' : `${componentCount} components`}
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onToggleSettings}
          title="Section settings"
          className="p-1.5 rounded-lg transition"
          style={settingsOpen ? { color: theme.accent, background: theme.accentBg } : { color: theme.textTertiary }}
          onMouseEnter={(e) => { if (!settingsOpen) e.currentTarget.style.color = theme.textPrimary }}
          onMouseLeave={(e) => { if (!settingsOpen) e.currentTarget.style.color = theme.textTertiary }}
        >
          <GearIcon size={15} />
        </button>
        <button
          type="button"
          onClick={onToggleVisibility}
          title={section.isVisible ? 'Hide this section' : 'Show this section'}
          className="p-1.5 rounded-lg transition"
          style={{ color: theme.textTertiary }}
          onMouseEnter={(e) => (e.currentTarget.style.color = theme.textPrimary)}
          onMouseLeave={(e) => (e.currentTarget.style.color = theme.textTertiary)}
        >
          {section.isVisible ? <EyeIcon size={16} /> : <EyeOffIcon size={16} />}
        </button>
        <button
          type="button"
          onClick={onRemove}
          title="Remove section"
          className="p-1.5 rounded-lg transition"
          style={{ color: theme.danger }}
          onMouseEnter={(e) => (e.currentTarget.style.background = theme.dangerBgHover)}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <TrashIcon size={14} />
        </button>
      </div>
    </div>
  )
}

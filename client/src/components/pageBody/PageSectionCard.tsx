import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { theme } from '../../theme'
import { TextField } from '../ui/FormField'
import PageSectionCardHeader from './PageSectionCardHeader'
import SectionSettingsPanel from './SectionSettingsPanel'
import PageComponentCard from './PageComponentCard'
import PageComponentTypePicker from './PageComponentTypePicker'
import SortableSectionList from '../ui/SortableSectionList'
import { MAX_COMPONENTS_PER_SECTION } from '../../constants/pageSections'
import { createEmptyComponentOfType } from '../../factories/pageElements'
import type { PageSection, PageComponent, PageComponentType } from '../../types/page'

export default function PageSectionCard({
  id,
  applicationId,
  section,
  onChange,
  onRemove,
}: {
  id: string
  applicationId: string
  section: PageSection
  onChange: (next: PageSection) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const [settingsOpen, setSettingsOpen] = useState(false)
  // Whether this card's editor body is expanded — UI-only, never persisted,
  // and independent of `section.isVisible` (that's a publish/render toggle;
  // a hidden section can still be expanded and edited). Defaults closed so a
  // page with many sections loads as a scannable list of headers rather than
  // every section's full editor at once.
  const [open, setOpen] = useState(false)

  function updateComponent(index: number, next: PageComponent) {
    const components = section.components.slice()
    components[index] = next
    onChange({ ...section, components })
  }

  function removeComponent(index: number) {
    onChange({ ...section, components: section.components.filter((_, i) => i !== index) })
  }

  function addComponent(type: PageComponentType) {
    if (section.components.length >= MAX_COMPONENTS_PER_SECTION) return
    onChange({ ...section, components: [...section.components, createEmptyComponentOfType(type)] })
  }

  function reorderComponents(next: PageComponent[]) {
    onChange({ ...section, components: next })
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : section.isVisible ? 1 : 0.55,
        background: theme.surface,
        border: `1px solid ${theme.border}`,
      }}
      className="rounded-2xl p-5"
    >
      <PageSectionCardHeader
        section={section}
        componentCount={section.components.length}
        dragHandleProps={{ attributes, listeners }}
        open={open}
        onToggleOpen={() => setOpen((v) => !v)}
        settingsOpen={settingsOpen}
        onToggleSettings={() => setSettingsOpen((v) => !v)}
        onToggleVisibility={() => onChange({ ...section, isVisible: !section.isVisible })}
        onRemove={onRemove}
      />

      {open && (
        <div className="mt-4 space-y-4">
          <TextField
            label="Section title"
            value={section.title}
            onChange={(title) => onChange({ ...section, title })}
            placeholder="About us"
          />

          {settingsOpen && (
            <SectionSettingsPanel
              settings={section.settings}
              onChange={(settings) => onChange({ ...section, settings })}
            />
          )}

          {section.components.length === 0 ? (
            <p className="text-sm" style={{ color: theme.textTertiary }}>
              This section is empty. Use "Add Component" to fill it in — mix and match Hero Sliders,
              Cards, Headings, and more.
            </p>
          ) : (
            <SortableSectionList
              sections={section.components}
              getId={(c) => c.cid!}
              onReorder={reorderComponents}
              renderSection={(component, i) => (
                <PageComponentCard
                  key={component.cid}
                  id={component.cid!}
                  applicationId={applicationId}
                  component={component}
                  onChange={(next) => updateComponent(i, next)}
                  onRemove={() => removeComponent(i)}
                />
              )}
            />
          )}

          {section.components.length < MAX_COMPONENTS_PER_SECTION && (
            <div className="flex justify-end">
              <PageComponentTypePicker onPick={addComponent} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

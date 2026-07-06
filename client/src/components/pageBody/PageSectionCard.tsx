import { useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { theme } from '../../theme'
import { DragHandleIcon, TrashIcon, PlusIcon, EyeIcon, EyeOffIcon, GearIcon } from '../icons'
import { PageElementEditor } from './pageElementEditorRegistry'
import {
  PAGE_SECTION_LAYOUTS, PAGE_SECTION_TYPE_LABELS, PAGE_ELEMENT_TYPE_LABELS,
  SECTION_SPACING_VALUES, SECTION_SPACING_LABELS, SECTION_WIDTH_VALUES, SECTION_WIDTH_LABELS,
  SECTION_TEXT_ALIGN_VALUES,
  createEmptyElementOfType, type PageSection, type PageElement, type SectionSettings, type SectionTextAlign,
} from '../../types/page'

const TEXT_ALIGN_ICON: Record<SectionTextAlign, string> = { left: '⟵', center: '↔', right: '⟶' }

function ElementRow({
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
      className="rounded-xl p-4"
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

function PillGroup<T extends string>({
  value,
  options,
  labels,
  onChange,
}: {
  value: T
  options: readonly T[]
  labels: Record<T, string>
  onChange: (next: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const active = option === value
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition"
            style={active
              ? { background: theme.accentBg, border: '1px solid rgba(124,58,237,0.5)', color: theme.accent }
              : { background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textSecondary }
            }
          >
            {labels[option]}
          </button>
        )
      })}
    </div>
  )
}

function SectionSettingsPanel({
  settings,
  onChange,
}: {
  settings: SectionSettings
  onChange: (next: SectionSettings) => void
}) {
  // A free-typed color renders fine in the native swatch only when it's a
  // hex value — anything else (a CSS name, `transparent`, blank) just falls
  // back to a neutral swatch rather than the browser rejecting the input.
  const swatchValue = /^#[0-9a-f]{6}$/i.test(settings.backgroundColor) ? settings.backgroundColor : '#0d1635'

  return (
    <div className="rounded-xl p-4 mb-3 space-y-3" style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}` }}>
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textSecondary }}>
          Background color
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={swatchValue}
            onChange={(e) => onChange({ ...settings, backgroundColor: e.target.value })}
            className="w-9 h-9 rounded-lg cursor-pointer shrink-0"
            style={{ border: `1px solid ${theme.inputBorder}`, background: 'transparent' }}
          />
          <input
            value={settings.backgroundColor}
            onChange={(e) => onChange({ ...settings, backgroundColor: e.target.value })}
            placeholder="Default — e.g. #0d1635 or transparent"
            className="flex-1 px-3 py-2 rounded-xl text-sm outline-none transition"
            style={{ background: theme.surface, border: `1px solid ${theme.inputBorder}`, color: theme.textPrimary }}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textSecondary }}>
          Spacing
        </label>
        <PillGroup
          value={settings.spacing}
          options={SECTION_SPACING_VALUES}
          labels={SECTION_SPACING_LABELS}
          onChange={(spacing) => onChange({ ...settings, spacing })}
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textSecondary }}>
          Width
        </label>
        <PillGroup
          value={settings.width}
          options={SECTION_WIDTH_VALUES}
          labels={SECTION_WIDTH_LABELS}
          onChange={(width) => onChange({ ...settings, width })}
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textSecondary }}>
          Text alignment
        </label>
        <PillGroup
          value={settings.textAlign}
          options={SECTION_TEXT_ALIGN_VALUES}
          labels={TEXT_ALIGN_ICON}
          onChange={(textAlign) => onChange({ ...settings, textAlign })}
        />
      </div>
    </div>
  )
}

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
  const layout = PAGE_SECTION_LAYOUTS[section.type]
  const itemLabel = PAGE_ELEMENT_TYPE_LABELS[layout.elementType]
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Stable per-row ids for dnd-kit, decoupled from array index — same
  // approach as body/ImageGalleryElementEditor.tsx.
  const idsRef = useRef<string[]>(section.elements.map(() => crypto.randomUUID()))
  while (idsRef.current.length < section.elements.length) idsRef.current.push(crypto.randomUUID())
  if (idsRef.current.length > section.elements.length) idsRef.current.length = section.elements.length
  const ids = idsRef.current

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  function updateElement(index: number, next: PageElement) {
    const elements = section.elements.slice()
    elements[index] = next
    onChange({ ...section, elements })
  }

  function removeElement(index: number) {
    if (section.elements.length <= layout.min) return
    idsRef.current = idsRef.current.filter((_, i) => i !== index)
    onChange({ ...section, elements: section.elements.filter((_, i) => i !== index) })
  }

  function addElement() {
    if (section.elements.length >= layout.max) return
    idsRef.current = [...idsRef.current, crypto.randomUUID()]
    onChange({ ...section, elements: [...section.elements, createEmptyElementOfType(layout.elementType)] })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    idsRef.current = arrayMove(ids, oldIndex, newIndex)
    onChange({ ...section, elements: arrayMove(section.elements, oldIndex, newIndex) })
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 flex-wrap">
          <button type="button" {...attributes} {...listeners} className="cursor-grab touch-none" style={{ color: theme.textTertiary }}>
            <DragHandleIcon />
          </button>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: theme.accentBg, color: theme.accent }}>
            {PAGE_SECTION_TYPE_LABELS[section.type]}
          </span>
          {!section.isVisible && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: theme.textTertiary }}>
              Hidden
            </span>
          )}
          <span className="text-xs" style={{ color: theme.textTertiary }}>
            {section.elements.length} / {layout.max}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setSettingsOpen((v) => !v)}
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
            onClick={() => onChange({ ...section, isVisible: !section.isVisible })}
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

      {settingsOpen && (
        <SectionSettingsPanel
          settings={section.settings}
          onChange={(settings) => onChange({ ...section, settings })}
        />
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {section.elements.map((element, i) => (
              <ElementRow
                key={ids[i]}
                id={ids[i]}
                applicationId={applicationId}
                index={i}
                itemLabel={itemLabel}
                element={element}
                onChange={(next) => updateElement(i, next)}
                onRemove={() => removeElement(i)}
                canRemove={section.elements.length > layout.min}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {section.elements.length < layout.max && (
        <button
          type="button"
          onClick={addElement}
          className="flex items-center gap-1.5 text-sm font-medium transition mt-3"
          style={{ color: theme.accent }}
        >
          <PlusIcon size={14} /> Add {itemLabel.toLowerCase()}
        </button>
      )}
    </div>
  )
}

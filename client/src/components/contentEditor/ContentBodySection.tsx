import { theme } from '../../theme'
import { ChevronIcon } from '../icons'
import SectionCard from '../body/SectionCard'
import SectionTypePicker from '../body/SectionTypePicker'
import SortableSectionList from '../ui/SortableSectionList'
import type { ContentSection } from '../../types/content'

// Content's collapsible "Body" panel — a dynamic list of sections, only
// meaningful once the content actually exists (hidden on the create form,
// same convention as PageForm's Sections panel).
export default function ContentBodySection({
  applicationId,
  open,
  onToggle,
  sections,
  onAddSection,
  onChangeSection,
  onRemoveSection,
  onReorder,
}: {
  applicationId: string
  open: boolean
  onToggle: () => void
  sections: ContentSection[]
  onAddSection: (type: ContentSection['type']) => void
  onChangeSection: (index: number, next: ContentSection) => void
  onRemoveSection: (index: number) => void
  onReorder: (next: ContentSection[]) => void
}) {
  return (
    <>
      <div style={{ borderTop: `1px solid ${theme.border}` }} />

      <div>
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-1.5 text-sm font-medium transition"
          style={{ color: theme.textSecondary }}
          onMouseEnter={(e) => (e.currentTarget.style.color = theme.textPrimary)}
          onMouseLeave={(e) => (e.currentTarget.style.color = theme.textSecondary)}
        >
          <ChevronIcon open={open} size={14} />
          Body
          {sections.length > 0 && (
            <span
              className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: theme.accentBg, color: theme.accent }}
            >
              {sections.length}
            </span>
          )}
        </button>
        {open && (
          <div className="mt-4 space-y-3">
            <div className="flex justify-end">
              <SectionTypePicker onPick={onAddSection} />
            </div>
            {sections.length === 0 ? (
              <p className="text-sm" style={{ color: theme.textTertiary }}>
                No sections yet. Use "Add Section" to build this page's body.
              </p>
            ) : (
              <SortableSectionList
                sections={sections}
                getId={(s) => s.cid!}
                onReorder={onReorder}
                renderSection={(section, i) => (
                  <SectionCard
                    key={section.cid}
                    id={section.cid!}
                    applicationId={applicationId}
                    section={section}
                    onChange={(next) => onChangeSection(i, next)}
                    onRemove={() => onRemoveSection(i)}
                  />
                )}
              />
            )}
          </div>
        )}
      </div>
    </>
  )
}

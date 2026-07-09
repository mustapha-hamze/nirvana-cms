import { theme } from '../../theme'
import { PlusIcon } from '../icons'
import PageSectionCard from '../pageBody/PageSectionCard'
import SortableSectionList from '../ui/SortableSectionList'
import type { PageSection } from '../../types/page'

// Page's "Sections" area — always shown (not a single collapsible block like
// ContentBodySection): Sections ARE the page, and with many sections already
// added, a global collapse just hides everything an editor is actively
// working on. Each PageSectionCard has its own open/closed state instead.
export default function PageSectionsPanel({
  applicationId,
  sections,
  onAddSection,
  onChangeSection,
  onRemoveSection,
  onReorder,
}: {
  applicationId: string
  sections: PageSection[]
  onAddSection: () => void
  onChangeSection: (index: number, next: PageSection) => void
  onRemoveSection: (index: number) => void
  onReorder: (next: PageSection[]) => void
}) {
  return (
    <>
      <div style={{ borderTop: `1px solid ${theme.border}` }} />

      <div>
        <div className="flex items-center gap-1.5 text-sm font-medium mb-4" style={{ color: theme.textPrimary }}>
          Sections
          {sections.length > 0 && (
            <span
              className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: theme.accentBg, color: theme.accent }}
            >
              {sections.length}
            </span>
          )}
        </div>
        <div className="space-y-3">
          {sections.length === 0 ? (
            <p className="text-sm" style={{ color: theme.textTertiary }}>
              No sections yet. Use "Add Section" to build this page, then fill each one in with components.
            </p>
          ) : (
            <SortableSectionList
              sections={sections}
              getId={(s) => s.cid!}
              onReorder={onReorder}
              renderSection={(section, i) => (
                <PageSectionCard
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
          {/* Bottom, not top — with many sections already added, scrolling
              back up just to add the next one is the friction this avoids. */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onAddSection}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97]"
              style={{ background: theme.accentGradient, boxShadow: '0 2px 16px rgba(124,58,237,0.35)' }}
            >
              <PlusIcon />
              Add Section
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

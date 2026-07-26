import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
      <Separator />

      <div>
        <div className="flex items-center gap-1.5 text-sm font-medium mb-4 text-foreground">
          Sections
          {sections.length > 0 && (
            <Badge variant="accent" className="text-xs font-semibold">
              {sections.length}
            </Badge>
          )}
        </div>
        <div className="space-y-3">
          {sections.length === 0 ? (
            <p className="text-sm text-(--color-text-tertiary)">
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
            <Button type="button" onClick={onAddSection}>
              <PlusIcon />
              Add Section
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

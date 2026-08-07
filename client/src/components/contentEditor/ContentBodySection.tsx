import { Separator } from '@/components/ui/separator'
import CollapsibleSectionHeader from '../ui/CollapsibleSectionHeader'
import SectionCard from '../body/SectionCard'
import SectionTypePicker from '../body/SectionTypePicker'
import SortableSectionList from '../ui/SortableSectionList'
import { useLocale } from '../../i18n/useLocale'
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
  const { t } = useLocale()
  return (
    <>
      <Separator />

      <div>
        <CollapsibleSectionHeader open={open} onToggle={onToggle} label={t('builder.body')} count={sections.length} />
        {open && (
          <div className="mt-4 space-y-3">
            <div className="flex justify-end">
              <SectionTypePicker onPick={onAddSection} />
            </div>
            {sections.length === 0 ? (
              <p className="text-sm text-(--color-text-tertiary)">
                {t('builder.noSectionsYetContent')}
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

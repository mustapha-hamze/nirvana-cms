import { Separator } from '@/components/ui/separator'
import StatusToggle from '../ui/StatusToggle'

// Homepage toggle — admin-only, shared across every language of a page (a
// page's identity doesn't change per language), and only meaningful once the
// page actually exists.
export default function HomepagePanel({
  isHomepage,
  onToggle,
}: {
  isHomepage: boolean
  onToggle: () => void
}) {
  return (
    <>
      <Separator />

      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-muted-foreground">
            Homepage
          </label>
          <div className="flex items-center gap-2">
            <StatusToggle
              checked={isHomepage}
              onToggle={onToggle}
              onLabel="Set as homepage"
              offLabel="Unset as homepage"
            />
            <span className="text-sm font-medium text-muted-foreground">
              {isHomepage ? "This is the site's homepage" : 'Not the homepage'}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

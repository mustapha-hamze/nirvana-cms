import { Separator } from '@/components/ui/separator'
import StatusToggle from '../ui/StatusToggle'
import { useLocale } from '../../i18n/useLocale'

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
  const { t } = useLocale()
  return (
    <>
      <Separator />

      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-muted-foreground">
            {t('table.homepage')}
          </label>
          <div className="flex items-center gap-2">
            <StatusToggle
              checked={isHomepage}
              onToggle={onToggle}
              onLabel={t('builder.setAsHomepage')}
              offLabel={t('builder.unsetAsHomepage')}
            />
            <span className="text-sm font-medium text-muted-foreground">
              {isHomepage ? t('builder.isHomepage') : t('builder.notHomepage')}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

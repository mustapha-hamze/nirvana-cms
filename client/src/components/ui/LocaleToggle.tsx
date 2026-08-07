import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { GlobeIcon } from '../icons'
import { useLocale } from '../../i18n/useLocale'
import type { Locale } from '../../i18n/types'

const LOCALE_OPTIONS: { value: Locale; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'fa', label: 'فارسی' },
]

export default function LocaleToggle({ className, contentClassName }: { className?: string; contentClassName?: string }) {
  const { locale, setLocale, t } = useLocale()

  return (
    <Tooltip>
      <DropdownMenu>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t('common.changeLanguage')}
              className={cn('shrink-0 text-muted-foreground hover:text-foreground', className)}
            >
              <GlobeIcon size={16} />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <DropdownMenuContent align="end" className={cn('min-w-32', contentClassName)}>
          {LOCALE_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setLocale(option.value)}
              className={cn('text-sm', option.value === locale && 'font-semibold text-primary')}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <TooltipContent>{t('common.changeLanguage')}</TooltipContent>
    </Tooltip>
  )
}

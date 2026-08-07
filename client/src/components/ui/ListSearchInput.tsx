import { Input } from '@/components/ui/input'
import { SearchIcon } from '../icons'
import { useLocale } from '../../i18n/useLocale'

// Shared search box for admin list pages — debounced search state itself
// lives in useListQuery, this just renders the input.
export default function ListSearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const { t } = useLocale()
  return (
    <div className="relative mb-4 max-w-sm">
      <span className="absolute start-3 top-1/2 -translate-y-1/2 text-(--color-text-tertiary)">
        <SearchIcon size={14} />
      </span>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? t('common.searchByTitleOrId')}
        className="ps-9"
      />
    </div>
  )
}

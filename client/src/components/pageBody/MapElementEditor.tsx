import { TextField } from '../ui/FormField'
import { useLocale } from '../../i18n/useLocale'
import type { MapElement } from '../../types/page'

export default function MapElementEditor({
  element,
  onChange,
}: {
  element: MapElement
  onChange: (next: MapElement) => void
}) {
  const { t } = useLocale()
  return (
    <div className="space-y-3">
      <TextField label={t('pageBuilder.address')} value={element.address} onChange={(address) => onChange({ ...element, address })} placeholder={t('pageBuilder.addressPlaceholder')} />
      <TextField
        label={t('pageBuilder.embedUrl')}
        value={element.embedUrl}
        onChange={(embedUrl) => onChange({ ...element, embedUrl })}
        placeholder={t('pageBuilder.embedUrlPlaceholder')}
      />
      <p className="text-xs -mt-2 text-(--color-text-tertiary)">
        {t('pageBuilder.embedUrlHint')}
      </p>

      <div className="grid grid-cols-3 gap-3">
        <TextField
          label={t('pageBuilder.latitude')} type="number"
          value={element.latitude === null ? '' : String(element.latitude)}
          onChange={(v) => onChange({ ...element, latitude: v === '' ? null : Number(v) })}
          placeholder={t('pageBuilder.latitudePlaceholder')}
        />
        <TextField
          label={t('pageBuilder.longitude')} type="number"
          value={element.longitude === null ? '' : String(element.longitude)}
          onChange={(v) => onChange({ ...element, longitude: v === '' ? null : Number(v) })}
          placeholder={t('pageBuilder.longitudePlaceholder')}
        />
        <TextField
          label={t('pageBuilder.zoom')} type="number"
          value={String(element.zoom)}
          onChange={(v) => onChange({ ...element, zoom: v === '' ? 14 : Number(v) })}
        />
      </div>
    </div>
  )
}

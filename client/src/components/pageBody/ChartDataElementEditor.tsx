import { cn } from '@/lib/utils'
import { SelectField, TextField } from '../ui/FormField'
import StringListField from './StringListField'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PlusIcon, TrashIcon } from '../icons'
import type { ChartDataElement, ChartSeries } from '../../types/page'
import { CHART_TYPE_VALUES, CHART_TYPE_KEYS } from '../../constants/pageSections'
import { getTextDirection } from '../../utils/rtl'
import { useLocale } from '../../i18n/useLocale'

const MAX_SERIES = 8

export default function ChartDataElementEditor({
  element,
  onChange,
}: {
  element: ChartDataElement
  onChange: (next: ChartDataElement) => void
}) {
  const { t } = useLocale()
  const CHART_TYPE_OPTIONS = CHART_TYPE_VALUES.map((type) => ({ value: type, label: t(CHART_TYPE_KEYS[type]) }))
  // Every series must have exactly as many data points as there are labels
  // (enforced server-side too) — so changing the label list re-shapes every
  // series' data array in lockstep, padding new slots with 0 and dropping
  // any that no longer have a matching label.
  function updateLabels(labels: string[]) {
    const series = element.series.map((s) => ({
      ...s,
      data: labels.map((_, i) => s.data[i] ?? 0),
    }))
    onChange({ ...element, labels, series })
  }

  function updateSeries(index: number, patch: Partial<ChartSeries>) {
    const series = element.series.slice()
    series[index] = { ...series[index], ...patch }
    onChange({ ...element, series })
  }

  function updateDataPoint(seriesIndex: number, pointIndex: number, value: number) {
    const data = element.series[seriesIndex].data.slice()
    data[pointIndex] = value
    updateSeries(seriesIndex, { data })
  }

  function removeSeries(index: number) {
    onChange({ ...element, series: element.series.filter((_, i) => i !== index) })
  }

  function addSeries() {
    onChange({
      ...element,
      series: [...element.series, { label: '', color: '', data: element.labels.map(() => 0) }],
    })
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label={t('pageBuilder.chartType')}
          value={element.chartType}
          onChange={(chartType) => onChange({ ...element, chartType })}
          options={CHART_TYPE_OPTIONS}
        />
        <TextField label={t('pageBuilder.chartTitle')} value={element.title} onChange={(title) => onChange({ ...element, title })} placeholder={t('pageBuilder.chartTitlePlaceholder')} />
      </div>

      <StringListField label={t('pageBuilder.labels')} values={element.labels} onChange={updateLabels} placeholder={t('pageBuilder.labelsPlaceholder')} max={20} />

      <div>
        <Label className="mb-1.5 text-sm font-medium text-muted-foreground">
          {t('pageBuilder.series', { count: element.series.length })}
        </Label>
        <div className="space-y-3">
          {element.series.map((series, si) => (
            <div key={si} className="p-3 rounded-xl border space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  value={series.label}
                  onChange={(e) => updateSeries(si, { label: e.target.value })}
                  placeholder={t('pageBuilder.seriesNamePlaceholder')}
                  dir={getTextDirection(series.label)}
                  className={cn('flex-1', getTextDirection(series.label) === 'rtl' && 'rtl-text')}
                />
                <input
                  type="color"
                  value={series.color || '#7c3aed'}
                  onChange={(e) => updateSeries(si, { color: e.target.value })}
                  title={t('pageBuilder.seriesColor')}
                  className="w-10 h-10 rounded-lg shrink-0 cursor-pointer border bg-transparent"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeSeries(si)}
                  title={t('pageBuilder.removeSeries')}
                  className="icon-btn-danger shrink-0 hover:bg-transparent"
                >
                  <TrashIcon size={14} />
                </Button>
              </div>
              {element.labels.length === 0 ? (
                <p className="text-xs text-(--color-text-tertiary)">
                  {t('pageBuilder.addLabelsHint')}
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {element.labels.map((label, li) => (
                    <div key={li}>
                      <Label className="mb-1 text-xs text-(--color-text-tertiary)">
                        {label || `#${li + 1}`}
                      </Label>
                      <Input
                        type="number"
                        value={series.data[li] ?? 0}
                        onChange={(e) => updateDataPoint(si, li, Number(e.target.value))}
                        className="h-auto px-2.5 py-1.5 text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        {element.series.length < MAX_SERIES && (
          <Button type="button" variant="link" onClick={addSeries} className="h-auto gap-1.5 p-0 text-sm font-medium mt-2 hover:no-underline">
            <PlusIcon size={14} /> {t('pageBuilder.addSeries')}
          </Button>
        )}
      </div>
    </div>
  )
}

import { Skeleton } from '@/components/ui/skeleton'
import {
  HEATMAP_REGIONS,
  MONTH_NAMES,
  REGION_DISPLAY,
  type HeatmapCell,
  type HeatmapRegion,
} from '@/lib/mock-data'
import { useHeatmap } from './useInsights'

/** Map a score 0-100 to a Tailwind bg + text class using a 5-step scale. */
function scoreToStyle(score: number): { bg: string; text: string } {
  if (score >= 80) return { bg: 'bg-emerald-600 dark:bg-emerald-500', text: 'text-white' }
  if (score >= 65) return { bg: 'bg-emerald-400 dark:bg-emerald-600', text: 'text-emerald-950 dark:text-white' }
  if (score >= 50) return { bg: 'bg-emerald-200 dark:bg-emerald-800', text: 'text-emerald-900 dark:text-emerald-100' }
  if (score >= 35) return { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-300' }
  return { bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-400 dark:text-slate-500' }
}

interface HeatmapGridProps {
  cells: HeatmapCell[]
}

function HeatmapGrid({ cells }: HeatmapGridProps) {
  // Build a lookup: region → month → score
  const lookup: Record<string, Record<number, number>> = {}
  for (const cell of cells) {
    lookup[cell.region] ??= {}
    lookup[cell.region][cell.month] = cell.score
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            {/* Region label column header */}
            <th className="py-2 pr-3 text-left font-medium text-muted-foreground w-28" />
            {MONTH_NAMES.map((m) => (
              <th
                key={m}
                className="px-1 py-2 text-center font-medium text-muted-foreground"
              >
                {m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HEATMAP_REGIONS.map((region) => (
            <tr key={region}>
              <td className="py-1 pr-3 font-medium text-foreground whitespace-nowrap">
                {REGION_DISPLAY[region as HeatmapRegion]}
              </td>
              {MONTH_NAMES.map((_, monthIdx) => {
                const score = lookup[region]?.[monthIdx] ?? 0
                const { bg, text } = scoreToStyle(score)
                return (
                  <td key={monthIdx} className="px-0.5 py-0.5">
                    <div
                      className={`${bg} ${text} rounded flex items-center justify-center h-8 w-full font-semibold tabular-nums`}
                      title={`${REGION_DISPLAY[region as HeatmapRegion]} · ${MONTH_NAMES[monthIdx]}: score ${score}`}
                    >
                      {score}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Legend() {
  const steps = [
    { label: '≥ 80', bg: 'bg-emerald-600', text: 'text-white' },
    { label: '65-79', bg: 'bg-emerald-400', text: 'text-emerald-950' },
    { label: '50-64', bg: 'bg-emerald-200', text: 'text-emerald-900' },
    { label: '35-49', bg: 'bg-slate-100', text: 'text-slate-600' },
    { label: '< 35', bg: 'bg-slate-50 border', text: 'text-slate-400' },
  ]
  return (
    <div className="flex items-center gap-2 mt-3 flex-wrap">
      <span className="text-xs text-muted-foreground mr-1">Deal score:</span>
      {steps.map((s) => (
        <span
          key={s.label}
          className={`${s.bg} ${s.text} rounded px-2 py-0.5 text-xs font-semibold`}
        >
          {s.label}
        </span>
      ))}
    </div>
  )
}

export function SeasonalityHeatmap() {
  const { data: cells, isLoading } = useHeatmap()

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="font-semibold text-base">📅 Estacionalidad por región</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Mejor época para cada destino — deal score promedio por mes
        </p>
      </div>

      {isLoading || !cells ? (
        <Skeleton className="h-48 w-full rounded-lg" />
      ) : (
        <>
          <HeatmapGrid cells={cells} />
          <Legend />
        </>
      )}
    </div>
  )
}

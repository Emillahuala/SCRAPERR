import { Skeleton } from '@/components/ui/skeleton'
import { formatUSD } from '@/lib/format'
import { REGION_DISPLAY, type HeatmapRegion } from '@/lib/mock-data'
import { useKpiSummary } from './useInsights'

interface StatCardProps {
  icon: string
  label: string
  value: string
  sub: string
  highlight?: boolean
}

function StatCard({ icon, label, value, sub, highlight = false }: StatCardProps) {
  return (
    <div className="rounded-xl border bg-card p-5 flex flex-col gap-2 shadow-sm">
      <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
        <span className="text-xl">{icon}</span>
        {label}
      </div>
      <p
        className={`text-3xl font-bold tracking-tight ${
          highlight ? 'text-emerald-600 dark:text-emerald-400' : ''
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  )
}

function StatCardSkeleton() {
  return <Skeleton className="h-32 rounded-xl" />
}

export function KpiCards() {
  const { data, isLoading } = useKpiSummary()

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  const regionLabel =
    REGION_DISPLAY[data.bestRegion as HeatmapRegion] ?? data.bestRegion ?? '—'

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        icon="🎯"
        label="Ofertas activas"
        value={String(data.totalActiveDeals)}
        sub="mínimos de 180 días detectados hoy"
      />
      <StatCard
        icon="💸"
        label="Ahorro promedio"
        value={`${data.avgSavingsPct} %`}
        sub="vs precio promedio semestral"
        highlight={data.avgSavingsPct >= 20}
      />
      <StatCard
        icon="🏆"
        label="Mejor región"
        value={regionLabel}
        sub={`deal score promedio ${data.avgDealScore}`}
      />
      <StatCard
        icon="🚢"
        label="Zarpe más barato"
        value={formatUSD(data.cheapestPrice)}
        sub={data.cheapestItinerary}
        highlight
      />
    </div>
  )
}

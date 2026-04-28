import { useParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatNights, dealScoreLabel } from '@/lib/format'
import { useSailing, usePriceHistory } from './useSailing'
import { KpiRow } from './KpiRow'
import { PriceChart } from './PriceChart'

function SailingDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-6 w-48" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}

export function SailingDetail() {
  const { id } = useParams<{ id: string }>()
  const sailingId = id ? parseInt(id, 10) : 0

  const { data: sailing, isLoading: sailingLoading, isError } = useSailing(sailingId)
  const { data: history = [], isLoading: historyLoading } = usePriceHistory(sailingId)

  if (sailingLoading || historyLoading) {
    return <SailingDetailSkeleton />
  }

  if (isError || !sailing) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-2xl font-semibold">Zarpe no encontrado</p>
        <p className="text-muted-foreground">El ID {sailingId} no existe o fue eliminado.</p>
        <Button asChild variant="outline">
          <Link to="/">← Volver a ofertas</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/">← Ofertas</Link>
        </Button>
        <div className="flex flex-wrap items-start gap-3">
          <h1 className="text-2xl font-bold tracking-tight flex-1">{sailing.itinerary}</h1>
          <Badge variant={sailing.deal_score && sailing.deal_score >= 60 ? 'success' : 'secondary'}>
            {dealScoreLabel(sailing.deal_score)}
          </Badge>
        </div>
        <p className="text-muted-foreground mt-1">
          {sailing.cruise_line} · {sailing.ship} · {formatDate(sailing.departure_date)} ·{' '}
          {formatNights(sailing.duration_nights)} desde {sailing.departure_port}
        </p>
      </div>

      {/* KPIs */}
      <KpiRow
        currentPrice={sailing.current_price}
        avgPrice={sailing.avg_price_180d}
        zScore={sailing.z_score}
        dealScore={sailing.deal_score}
        daysToDeparture={sailing.days_to_departure}
      />

      {/* Price history chart */}
      <PriceChart data={history} avgPrice180d={sailing.avg_price_180d} />

      {/* CTA */}
      <div className="flex justify-end">
        <Button asChild>
          <a
            href={`https://cruceros.cl`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver en cruceros.cl ↗
          </a>
        </Button>
      </div>
    </div>
  )
}

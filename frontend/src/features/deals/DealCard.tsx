import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatUSD, formatDate, formatNights, formatZScore, dealScoreLabel } from '@/lib/format'
import type { Database } from '@/types/database'

type DealRow = Database['public']['Views']['current_deals']['Row']

interface DealCardProps {
  deal: DealRow
}

function regionLabel(region: string | null): string {
  const labels: Record<string, string> = {
    caribe: 'Caribe',
    mediterraneo: 'Mediterráneo',
    fiordos: 'Fiordos',
    antillas: 'Antillas',
    sudamerica: 'Sudamérica',
    bahamas: 'Bahamas',
    islas_griegas: 'Islas Griegas',
    vuelta_mundo: 'Vuelta al Mundo',
    transatlantico: 'Trasatlántico',
    tahiti: 'Tahití',
    artico: 'Ártico',
  }
  return region ? (labels[region] ?? region) : '—'
}

export function DealCard({ deal }: DealCardProps) {
  const score = deal.deal_score ?? 0
  const scoreVariant: 'success' | 'secondary' | 'outline' =
    score >= 80 ? 'success' : score >= 60 ? 'secondary' : 'outline'

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            {regionLabel(deal.region)}
          </span>
          <Badge variant={scoreVariant}>{dealScoreLabel(deal.deal_score)}</Badge>
        </div>
        <h3 className="font-semibold leading-tight text-base mt-1">{deal.itinerary}</h3>
        <p className="text-sm text-muted-foreground">
          {deal.cruise_line} · {deal.ship}
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {/* Key stats */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <span className="text-muted-foreground">Zarpe</span>
          <span>{formatDate(deal.departure_date)}</span>

          <span className="text-muted-foreground">Puerto</span>
          <span>{deal.departure_port ?? '—'}</span>

          <span className="text-muted-foreground">Duración</span>
          <span>{formatNights(deal.duration_nights)}</span>

          <span className="text-muted-foreground">Cabina</span>
          <span>{deal.cabin_type ?? '—'}</span>
        </div>

        {/* Pricing */}
        <div className="rounded-lg bg-muted/50 px-4 py-3 flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Precio actual</p>
            <p className="text-2xl font-bold">{formatUSD(deal.current_price)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Promedio 180d</p>
            <p className="text-sm text-muted-foreground line-through">
              {formatUSD(deal.avg_price_180d)}
            </p>
            {deal.z_score !== null && (
              <p className="text-xs font-medium text-emerald-600">{formatZScore(deal.z_score)}</p>
            )}
          </div>
        </div>

        <Button asChild size="sm" variant="outline" className="w-full">
          <Link to={`/sailing/${deal.sailing_id}`}>Ver detalle →</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

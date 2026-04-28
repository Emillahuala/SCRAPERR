import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatUSD, formatDate } from '@/lib/format'
import type { MockAlert } from '@/lib/mock-data'
import { useToggleAlert, useDeleteAlert } from './useAlerts'

const CRUISE_LINE_NAMES: Record<number, string> = {
  1: 'Royal Caribbean',
  2: 'MSC Cruises',
  3: 'Norwegian Cruise Line',
  4: 'Costa Cruises',
  5: 'Celebrity Cruises',
  6: 'Carnival Cruise Line',
  7: 'Cunard',
}

const REGION_LABELS: Record<string, string> = {
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

function criteriaLines(alert: MockAlert): string[] {
  const lines: string[] = []
  if (alert.region) lines.push(`Región: ${REGION_LABELS[alert.region] ?? alert.region}`)
  if (alert.cruise_line_id)
    lines.push(`Línea: ${CRUISE_LINE_NAMES[alert.cruise_line_id] ?? `#${alert.cruise_line_id}`}`)
  if (alert.sailing_id) lines.push(`Zarpe específico: #${alert.sailing_id}`)
  if (alert.cabin_type) lines.push(`Cabina: ${alert.cabin_type}`)
  if (alert.max_price_usd != null) lines.push(`Precio máx.: ${formatUSD(alert.max_price_usd)}`)
  if (alert.min_z_score != null) lines.push(`Z-score mín.: ${alert.min_z_score}σ`)
  return lines
}

interface AlertCardProps {
  alert: MockAlert
}

export function AlertCard({ alert }: AlertCardProps) {
  const toggle = useToggleAlert()
  const remove = useDeleteAlert()

  const lines = criteriaLines(alert)

  return (
    <Card className={alert.active ? '' : 'opacity-60'}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <Badge variant={alert.active ? 'success' : 'outline'}>
            {alert.active ? 'Activa' : 'Pausada'}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {alert.channel === 'email' ? '📧' : alert.channel === 'telegram' ? '✈️' : '🔔'}{' '}
            {alert.channel}
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {/* Criteria summary */}
        {lines.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Sin filtros (todas las ofertas)</p>
        ) : (
          <ul className="text-sm space-y-1">
            {lines.map((l) => (
              <li key={l} className="flex items-start gap-1.5">
                <span className="text-muted-foreground">·</span>
                <span>{l}</span>
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs text-muted-foreground">
          Creada el {formatDate(alert.created_at)}
        </p>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={toggle.isPending}
            onClick={() => toggle.mutate({ id: alert.id, active: !alert.active })}
          >
            {alert.active ? 'Pausar' : 'Activar'}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={remove.isPending}
            onClick={() => remove.mutate(alert.id)}
          >
            Eliminar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

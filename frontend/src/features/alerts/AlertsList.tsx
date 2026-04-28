import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAlerts } from './useAlerts'
import { AlertCard } from './AlertCard'
import { AlertForm } from './AlertForm'
import { simulateMatch } from './useAlertNotifications'

function AlertsGrid() {
  const { data: alerts, isLoading, isError } = useAlerts()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-center text-destructive py-12">
        Error al cargar las alertas.
      </p>
    )
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-4xl">🔔</p>
        <p className="text-lg font-semibold">No tienes alertas todavía</p>
        <p className="text-muted-foreground text-sm max-w-xs">
          Crea tu primera alerta y te avisaremos cuando detectemos un mínimo de 6 meses.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {alerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </div>
  )
}

export function AlertsList() {
  const [formOpen, setFormOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">🔔 Mis alertas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Te avisamos cuando detectemos mínimos de 180 días
          </p>
        </div>
        <div className="flex gap-2">
          {/* Demo helper — visible only in mock mode */}
          <Button variant="outline" size="sm" onClick={simulateMatch}>
            Simular match
          </Button>
          <Button size="sm" onClick={() => setFormOpen(true)}>
            + Nueva alerta
          </Button>
        </div>
      </div>

      <AlertsGrid />

      <AlertForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  )
}

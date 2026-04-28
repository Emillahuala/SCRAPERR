import { Skeleton } from '@/components/ui/skeleton'
import { useDeals } from './useDeals'
import { DealCard } from './DealCard'
import { DealsFilters } from './DealsFilters'
import { useFiltersStore } from '@/store/filters-store'

function DealsGrid() {
  const { filters } = useFiltersStore()
  const { data: deals, isLoading, isError } = useDeals(filters)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-72 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-center text-destructive py-12">
        Error al cargar las ofertas. Intenta nuevamente.
      </p>
    )
  }

  if (!deals || deals.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12">
        No hay ofertas que coincidan con los filtros seleccionados.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {deals.map((deal) => (
        <DealCard key={`${deal.sailing_id}-${deal.cabin_type}`} deal={deal} />
      ))}
    </div>
  )
}

export function DealsList() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">🎯 Ofertas detectadas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Mínimos en 180 días en tiempo real
        </p>
      </div>
      <DealsFilters />
      <DealsGrid />
    </div>
  )
}

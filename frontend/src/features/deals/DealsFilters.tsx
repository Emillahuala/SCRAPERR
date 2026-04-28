import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useFiltersStore } from '@/store/filters-store'

const REGIONS = [
  { value: '', label: 'Todas las regiones' },
  { value: 'caribe', label: 'Caribe' },
  { value: 'mediterraneo', label: 'Mediterráneo' },
  { value: 'fiordos', label: 'Fiordos' },
  { value: 'antillas', label: 'Antillas' },
  { value: 'sudamerica', label: 'Sudamérica' },
  { value: 'bahamas', label: 'Bahamas' },
  { value: 'islas_griegas', label: 'Islas Griegas' },
]

const CABIN_TYPES = [
  { value: '', label: 'Todos los tipos' },
  { value: 'Interior', label: 'Interior' },
  { value: 'Océano', label: 'Vista al mar' },
  { value: 'Balcón', label: 'Balcón' },
  { value: 'Suite', label: 'Suite' },
]

export function DealsFilters() {
  const { filters, setRegion, setMaxPrice, setCabinType, setMinDealScore, resetFilters } =
    useFiltersStore()

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl border bg-card p-4">
      {/* Region */}
      <div className="flex flex-col gap-1.5 min-w-[160px]">
        <Label htmlFor="filter-region">Región</Label>
        <select
          id="filter-region"
          value={filters.region}
          onChange={(e) => setRegion(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {REGIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* Cabin type */}
      <div className="flex flex-col gap-1.5 min-w-[150px]">
        <Label htmlFor="filter-cabin">Tipo de cabina</Label>
        <select
          id="filter-cabin"
          value={filters.cabinType}
          onChange={(e) => setCabinType(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {CABIN_TYPES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Max price */}
      <div className="flex flex-col gap-1.5 min-w-[140px]">
        <Label htmlFor="filter-price">Precio máx. (USD)</Label>
        <Input
          id="filter-price"
          type="number"
          min={0}
          step={100}
          placeholder="Sin límite"
          value={filters.maxPrice ?? ''}
          onChange={(e) =>
            setMaxPrice(e.target.value ? Number(e.target.value) : null)
          }
        />
      </div>

      {/* Min deal score */}
      <div className="flex flex-col gap-1.5 min-w-[140px]">
        <Label htmlFor="filter-score">Deal score mínimo</Label>
        <Input
          id="filter-score"
          type="number"
          min={0}
          max={100}
          step={10}
          placeholder="0"
          value={filters.minDealScore || ''}
          onChange={(e) => setMinDealScore(Number(e.target.value))}
        />
      </div>

      <Button variant="ghost" size="sm" onClick={resetFilters} className="self-end">
        Limpiar
      </Button>
    </div>
  )
}

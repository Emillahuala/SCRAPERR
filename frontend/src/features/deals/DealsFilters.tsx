import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useFiltersStore } from '@/store/filters-store'
import { FaSortAmountDown, FaSortAmountUpAlt, FaStar } from 'react-icons/fa'
import clsx from 'clsx'

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

  const { filters, setRegion, setMaxPrice, setCabinType, setMinDealScore, setSortBy, resetFilters } =
    useFiltersStore()

  return (
    <div
      className={clsx(
        "rounded-xl border bg-card p-6 transition-shadow duration-300",
        "hover:shadow-[0_0_24px_0_rgba(34,197,94,0.15)] focus-within:shadow-[0_0_32px_4px_rgba(34,197,94,0.25)]"
      )}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Ordenar por */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-sort">Ordenar por</Label>
          <div className="relative">
            <select
              id="filter-sort"
              value={filters.sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex h-9 w-full appearance-none rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 pr-8 transition-all duration-200 hover:ring-2 hover:ring-green-300 focus:shadow-[0_0_8px_2px_rgba(34,197,94,0.25)]"
            >
              <option value="best">Mejores ofertas</option>
              <option value="price-asc">Precio más bajo</option>
              <option value="price-desc">Precio más alto</option>
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-green-400 drop-shadow-glow">
              {filters.sortBy === 'best' && <FaStar className="inline animate-pulse" />}
              {filters.sortBy === 'price-asc' && <FaSortAmountDown className="inline animate-bounce" />}
              {filters.sortBy === 'price-desc' && <FaSortAmountUpAlt className="inline animate-bounce" />}
            </span>
          </div>
        </div>

        {/* Región */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-region">Región</Label>
          <select
            id="filter-region"
            value={filters.region}
            onChange={(e) => setRegion(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 transition-all duration-200 hover:ring-2 hover:ring-green-300"
          >
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo de cabina */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-cabin">Tipo de cabina</Label>
          <select
            id="filter-cabin"
            value={filters.cabinType}
            onChange={(e) => setCabinType(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 transition-all duration-200 hover:ring-2 hover:ring-green-300"
          >
            {CABIN_TYPES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Precio máx. */}
        <div className="flex flex-col gap-1.5">
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
            className="transition-all duration-200 focus:ring-2 focus:ring-green-400 hover:ring-2 hover:ring-green-300"
          />
        </div>

        {/* Deal score mínimo */}
        <div className="flex flex-col gap-1.5">
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
            className="transition-all duration-200 focus:ring-2 focus:ring-green-400 hover:ring-2 hover:ring-green-300"
          />
        </div>

        {/* Limpiar */}
        <div className="flex flex-col gap-1.5 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="w-full transition-all duration-200 hover:shadow-[0_0_8px_2px_rgba(34,197,94,0.25)] focus:shadow-[0_0_12px_4px_rgba(34,197,94,0.25)]"
          >
            Limpiar
          </Button>
        </div>
      </div>
    </div>
  )
}

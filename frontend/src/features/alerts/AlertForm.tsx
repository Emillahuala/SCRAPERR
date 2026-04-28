/**
 * AlertForm — modal para crear una nueva alerta.
 *
 * Puede recibir `defaultValues` para pre-llenar (e.g. desde SailingDetail).
 * Todos los campos son opcionales; al menos uno de region/cruise_line_id/sailing_id
 * debe estar presente para que la alerta tenga sentido.
 */
import { useState, type FormEvent } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateAlert, type AlertFormValues, type AlertChannel } from './useAlerts'

const REGIONS = [
  { value: '', label: '— Cualquier región —' },
  { value: 'caribe', label: 'Caribe' },
  { value: 'mediterraneo', label: 'Mediterráneo' },
  { value: 'fiordos', label: 'Fiordos' },
  { value: 'antillas', label: 'Antillas' },
  { value: 'sudamerica', label: 'Sudamérica' },
  { value: 'bahamas', label: 'Bahamas' },
  { value: 'islas_griegas', label: 'Islas Griegas' },
  { value: 'vuelta_mundo', label: 'Vuelta al Mundo' },
]

const CABIN_TYPES = [
  { value: '', label: '— Cualquier cabina —' },
  { value: 'Interior', label: 'Interior' },
  { value: 'Océano', label: 'Vista al mar' },
  { value: 'Balcón', label: 'Balcón' },
  { value: 'Suite', label: 'Suite' },
  { value: 'from', label: 'Precio desde (sin tipo)' },
]

const CHANNELS: { value: AlertChannel; label: string }[] = [
  { value: 'email', label: '📧 Email' },
  { value: 'telegram', label: '✈️ Telegram (próximamente)' },
  { value: 'push', label: '🔔 Push (próximamente)' },
]

type SelectClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

const SELECT_CLS: SelectClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

interface AlertFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pre-fill specific sailing (e.g. from SailingDetail page) */
  defaultSailingId?: number | null
  /** Pre-fill region */
  defaultRegion?: string | null
}

export function AlertForm({
  open,
  onOpenChange,
  defaultSailingId = null,
  defaultRegion = null,
}: AlertFormProps) {
  const createAlert = useCreateAlert()

  const [region, setRegion] = useState(defaultRegion ?? '')
  const [cabinType, setCabinType] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minZScore, setMinZScore] = useState('')
  const [channel, setChannel] = useState<AlertChannel>('email')

  function resetForm() {
    setRegion(defaultRegion ?? '')
    setCabinType('')
    setMaxPrice('')
    setMinZScore('')
    setChannel('email')
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const values: AlertFormValues = {
      region: region || null,
      cruise_line_id: null, // future: add cruise line picker
      sailing_id: defaultSailingId,
      cabin_type: cabinType || null,
      max_price_usd: maxPrice ? Number(maxPrice) : null,
      min_z_score: minZScore ? Number(minZScore) : null,
      channel,
    }

    await createAlert.mutateAsync(values)
    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>🔔 Nueva alerta de precio</DialogTitle>
          <DialogDescription>
            Te avisaremos cuando detectemos un mínimo de 180 días que cumpla tus criterios.
            {defaultSailingId && (
              <span className="ml-1 text-primary font-medium">
                Zarpe #{defaultSailingId} pre-seleccionado.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4 px-6 pt-4">
          {/* Region */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="alert-region">
              Región{' '}
              <span className="text-muted-foreground font-normal text-xs">(opcional)</span>
            </Label>
            <select
              id="alert-region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className={SELECT_CLS}
              disabled={Boolean(defaultSailingId)}
            >
              {REGIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Cabin type */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="alert-cabin">
              Tipo de cabina{' '}
              <span className="text-muted-foreground font-normal text-xs">(opcional)</span>
            </Label>
            <select
              id="alert-cabin"
              value={cabinType}
              onChange={(e) => setCabinType(e.target.value)}
              className={SELECT_CLS}
            >
              {CABIN_TYPES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price + Z-score row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="alert-price">
                Precio máx. (USD){' '}
                <span className="text-muted-foreground font-normal text-xs">(opcional)</span>
              </Label>
              <Input
                id="alert-price"
                type="number"
                min={0}
                step={50}
                placeholder="Sin límite"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="alert-zscore">
                Z-score mín.{' '}
                <span className="text-muted-foreground font-normal text-xs">(opcional)</span>
              </Label>
              <Input
                id="alert-zscore"
                type="number"
                step={0.1}
                max={0}
                placeholder="ej. -2.0"
                value={minZScore}
                onChange={(e) => setMinZScore(e.target.value)}
              />
            </div>
          </div>

          {/* Channel */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="alert-channel">Canal de notificación</Label>
            <select
              id="alert-channel"
              value={channel}
              onChange={(e) => setChannel(e.target.value as AlertChannel)}
              className={SELECT_CLS}
            >
              {CHANNELS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={createAlert.isPending}>
              {createAlert.isPending ? 'Guardando…' : 'Crear alerta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

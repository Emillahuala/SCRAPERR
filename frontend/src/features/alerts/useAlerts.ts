/**
 * useAlerts — CRUD de alertas del usuario.
 *
 * Mock mode: opera sobre un array en memoria (React state vía Zustand).
 * Supabase mode (TODO): reemplazar queryFn/mutationFn con llamadas al cliente.
 *
 * RLS garantiza que cada usuario solo ve sus propias alertas —
 * en mock mode simplemente filtramos por MOCK_USER_ID.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MOCK_ALERTS, type MockAlert } from '@/lib/mock-data'

// In-memory store so mutations persist within the session
let _mockAlerts: MockAlert[] = [...MOCK_ALERTS]

export type AlertChannel = 'email' | 'telegram' | 'push'

export interface AlertFormValues {
  region: string | null
  cruise_line_id: number | null
  sailing_id: number | null
  cabin_type: string | null
  max_price_usd: number | null
  min_z_score: number | null
  channel: AlertChannel
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------
async function fetchAlerts(): Promise<MockAlert[]> {
  // TODO: replace with Supabase query when integrated
  // const supabase = getSupabaseClient()
  // const { data, error } = await supabase.from('alerts').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  // if (error) throw error
  // return data ?? []
  return Promise.resolve([..._mockAlerts])
}

export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
  })
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------
async function createAlert(values: AlertFormValues): Promise<MockAlert> {
  // TODO: replace with Supabase insert
  const newAlert: MockAlert = {
    id: `alert-${Date.now()}`,
    user_id: 'mock-user-id',
    ...values,
    active: true,
    created_at: new Date().toISOString(),
  }
  _mockAlerts = [newAlert, ..._mockAlerts]
  return newAlert
}

export function useCreateAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createAlert,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['alerts'] })
      toast.success('Alerta creada correctamente')
    },
    onError: (err: Error) => {
      toast.error(`Error al crear la alerta: ${err.message}`)
    },
  })
}

// ---------------------------------------------------------------------------
// Toggle active
// ---------------------------------------------------------------------------
async function toggleAlert({ id, active }: { id: string; active: boolean }): Promise<void> {
  // TODO: replace with Supabase update
  _mockAlerts = _mockAlerts.map((a) => (a.id === id ? { ...a, active } : a))
}

export function useToggleAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: toggleAlert,
    onSuccess: (_data, { active }) => {
      void qc.invalidateQueries({ queryKey: ['alerts'] })
      toast.success(active ? 'Alerta activada' : 'Alerta pausada')
    },
    onError: (err: Error) => {
      toast.error(`Error: ${err.message}`)
    },
  })
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------
async function deleteAlert(id: string): Promise<void> {
  // TODO: replace with Supabase delete
  _mockAlerts = _mockAlerts.filter((a) => a.id !== id)
}

export function useDeleteAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteAlert,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['alerts'] })
      toast.success('Alerta eliminada')
    },
    onError: (err: Error) => {
      toast.error(`Error al eliminar: ${err.message}`)
    },
  })
}

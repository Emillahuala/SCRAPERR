import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase'
import { MOCK_ALERTS, type MockAlert } from '@/lib/mock-data'

/**
 * In-memory store — mock mode only.
 * Mutations persist for the lifetime of the browser session.
 * Call resetMockAlerts() in beforeEach for test isolation.
 */
let _mockAlerts: MockAlert[] = [...MOCK_ALERTS]
export function resetMockAlerts(): void {
  _mockAlerts = [...MOCK_ALERTS]
}

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

/** Normalize a DB alerts row to MockAlert shape (narrows channel to union). */
function normalizeAlert(row: {
  id: string
  user_id: string
  region: string | null
  cruise_line_id: number | null
  sailing_id: number | null
  cabin_type: string | null
  max_price_usd: number | null
  min_z_score: number | null
  channel: string | null
  active: boolean | null
  created_at: string | null
}): MockAlert {
  const validChannels: AlertChannel[] = ['email', 'telegram', 'push']
  const channel = validChannels.includes(row.channel as AlertChannel)
    ? (row.channel as AlertChannel)
    : 'email'
  return { ...row, channel }
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------
async function fetchAlerts(): Promise<MockAlert[]> {
  const client = getSupabaseClient()
  if (!client) return [..._mockAlerts]

  const { data, error } = await client
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map(normalizeAlert)
}

export function useAlerts() {
  return useQuery({ queryKey: ['alerts'], queryFn: fetchAlerts })
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------
async function createAlert(values: AlertFormValues): Promise<MockAlert> {
  const client = getSupabaseClient()
  if (!client) {
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

  const { data: { session } } = await client.auth.getSession()
  if (!session) throw new Error('No autenticado')

  const { data, error } = await client
    .from('alerts')
    .insert({ ...values, user_id: session.user.id, channel: values.channel })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return normalizeAlert(data)
}

export function useCreateAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createAlert,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['alerts'] })
      toast.success('Alerta creada correctamente')
    },
    onError: (err: Error) => toast.error(`Error al crear la alerta: ${err.message}`),
  })
}

// ---------------------------------------------------------------------------
// Toggle active
// ---------------------------------------------------------------------------
async function toggleAlert({ id, active }: { id: string; active: boolean }): Promise<void> {
  const client = getSupabaseClient()
  if (!client) {
    _mockAlerts = _mockAlerts.map((a) => (a.id === id ? { ...a, active } : a))
    return
  }
  const { error } = await client.from('alerts').update({ active }).eq('id', id)
  if (error) throw new Error(error.message)
}

export function useToggleAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: toggleAlert,
    onSuccess: (_data, { active }) => {
      void qc.invalidateQueries({ queryKey: ['alerts'] })
      toast.success(active ? 'Alerta activada' : 'Alerta pausada')
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  })
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------
async function deleteAlert(id: string): Promise<void> {
  const client = getSupabaseClient()
  if (!client) {
    _mockAlerts = _mockAlerts.filter((a) => a.id !== id)
    return
  }
  const { error } = await client.from('alerts').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export function useDeleteAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteAlert,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['alerts'] })
      toast.success('Alerta eliminada')
    },
    onError: (err: Error) => toast.error(`Error al eliminar: ${err.message}`),
  })
}

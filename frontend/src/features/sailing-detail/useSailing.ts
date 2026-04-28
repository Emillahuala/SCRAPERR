import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase'
import { MOCK_DEALS, MOCK_PRICE_HISTORY, type PriceHistoryPoint } from '@/lib/mock-data'
import type { Database } from '@/types/database'

type DealRow = Database['public']['Views']['current_deals']['Row']

async function fetchSailing(sailingId: number): Promise<DealRow | null> {
  const client = getSupabaseClient()
  if (!client) return MOCK_DEALS.find((d) => d.sailing_id === sailingId) ?? null

  const { data, error } = await client
    .from('current_deals')
    .select('*')
    .eq('sailing_id', sailingId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

async function fetchPriceHistory(
  sailingId: number,
  cabinType: string | null,
): Promise<PriceHistoryPoint[]> {
  const client = getSupabaseClient()
  if (!client) return MOCK_PRICE_HISTORY[sailingId] ?? []

  // Filter by cabin_type if known, otherwise fetch the most data-rich cabin
  type PHRow = Database['public']['Tables']['price_history_daily']['Row']
  const result = await client
    .from('price_history_daily')
    .select('*')
    .eq('sailing_id', sailingId)
    .order('date', { ascending: true })
    .limit(180)

  if (result.error) throw new Error(result.error.message)

  const rows = (result.data as PHRow[] | null) ?? []
  const filtered = cabinType ? rows.filter((r) => r.cabin_type === cabinType) : rows

  return filtered.map((r) => ({
    date: r.date,
    avg_price: Number(r.avg_price ?? 0),
    min_price: Number(r.min_price ?? 0),
  }))
}

export function useSailing(sailingId: number) {
  return useQuery({
    queryKey: ['sailing', sailingId],
    queryFn: () => fetchSailing(sailingId),
    enabled: sailingId > 0,
  })
}

export function usePriceHistory(sailingId: number, cabinType: string | null = null) {
  return useQuery({
    queryKey: ['price-history', sailingId, cabinType],
    queryFn: () => fetchPriceHistory(sailingId, cabinType),
    enabled: sailingId > 0,
  })
}

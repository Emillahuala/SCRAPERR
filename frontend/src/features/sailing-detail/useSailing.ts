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

  type PHRaw = Database['public']['Tables']['price_history']['Row']
  let query = client
    .from('price_history')
    .select('price_usd, captured_at')
    .eq('sailing_id', sailingId)
    .order('captured_at', { ascending: true })
    .limit(1000)

  if (cabinType) query = query.eq('cabin_type', cabinType)

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const rows = (data as Pick<PHRaw, 'price_usd' | 'captured_at'>[] | null) ?? []

  // Aggregate captures by day: avg and min price per day
  const byDay = new Map<string, number[]>()
  for (const row of rows) {
    const day = row.captured_at.slice(0, 10)
    if (!byDay.has(day)) byDay.set(day, [])
    byDay.get(day)!.push(Number(row.price_usd))
  }

  return Array.from(byDay.entries()).map(([date, prices]) => ({
    date,
    avg_price: Math.round(prices.reduce((s, p) => s + p, 0) / prices.length),
    min_price: Math.min(...prices),
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

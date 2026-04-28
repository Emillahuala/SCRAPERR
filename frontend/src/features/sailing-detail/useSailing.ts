import { useQuery } from '@tanstack/react-query'
import { MOCK_DEALS, MOCK_PRICE_HISTORY, type PriceHistoryPoint } from '@/lib/mock-data'
import type { Database } from '@/types/database'

type DealRow = Database['public']['Views']['current_deals']['Row']

async function fetchSailing(sailingId: number): Promise<DealRow | null> {
  // TODO: replace with real Supabase query
  return Promise.resolve(MOCK_DEALS.find((d) => d.sailing_id === sailingId) ?? null)
}

async function fetchPriceHistory(sailingId: number): Promise<PriceHistoryPoint[]> {
  // TODO: replace with real Supabase query on price_history_daily
  return Promise.resolve(MOCK_PRICE_HISTORY[sailingId] ?? [])
}

export function useSailing(sailingId: number) {
  return useQuery({
    queryKey: ['sailing', sailingId],
    queryFn: () => fetchSailing(sailingId),
    enabled: sailingId > 0,
  })
}

export function usePriceHistory(sailingId: number) {
  return useQuery({
    queryKey: ['price-history', sailingId],
    queryFn: () => fetchPriceHistory(sailingId),
    enabled: sailingId > 0,
  })
}

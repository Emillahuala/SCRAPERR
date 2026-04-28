import { useQuery } from '@tanstack/react-query'
import { MOCK_DEALS } from '@/lib/mock-data'
import type { Database } from '@/types/database'
import type { DealsFilters } from '@/store/filters-store'

type DealRow = Database['public']['Views']['current_deals']['Row']

/** Apply client-side filters to the deals list. */
function applyFilters(deals: DealRow[], filters: DealsFilters): DealRow[] {
  return deals.filter((d) => {
    if (filters.region && d.region !== filters.region) return false
    if (filters.cabinType && d.cabin_type !== filters.cabinType) return false
    if (filters.maxPrice !== null && (d.current_price ?? Infinity) > filters.maxPrice) return false
    if (filters.minDealScore > 0 && (d.deal_score ?? 0) < filters.minDealScore) return false
    return true
  })
}

async function fetchDeals(): Promise<DealRow[]> {
  // TODO: replace with real Supabase query when integrated
  // const supabase = getSupabaseClient()
  // const { data, error } = await supabase.from('current_deals').select('*').eq('is_180d_low', true)
  // if (error) throw error
  // return data ?? []
  return Promise.resolve(MOCK_DEALS)
}

export function useDeals(filters: DealsFilters) {
  return useQuery({
    queryKey: ['deals'],
    queryFn: fetchDeals,
    select: (data) => applyFilters(data, filters),
  })
}

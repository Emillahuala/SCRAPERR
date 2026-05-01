import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase'
import { MOCK_DEALS } from '@/lib/mock-data'
import type { Database } from '@/types/database'
import type { DealsFilters } from '@/store/filters-store'

type DealRow = Database['public']['Views']['current_deals']['Row']

function applyFilters(deals: DealRow[], filters: DealsFilters): DealRow[] {
  let filtered = deals.filter((d) => {
    if (filters.region && d.region !== filters.region) return false
    if (filters.cabinType && d.cabin_type !== filters.cabinType) return false
    if (filters.maxPrice !== null && (d.current_price ?? Infinity) > filters.maxPrice) return false
    if (filters.minDealScore > 0 && (d.deal_score ?? 0) < filters.minDealScore) return false
    return true
  })

  // Ordenar según sortBy
  switch (filters.sortBy) {
    case 'price-asc':
      filtered = filtered.slice().sort((a, b) => (a.current_price ?? Infinity) - (b.current_price ?? Infinity))
      break
    case 'price-desc':
      filtered = filtered.slice().sort((a, b) => (b.current_price ?? 0) - (a.current_price ?? 0))
      break
    case 'best':
    default:
      filtered = filtered.slice().sort((a, b) => (b.deal_score ?? 0) - (a.deal_score ?? 0))
      break
  }
  return filtered
}

async function fetchDeals(): Promise<DealRow[]> {
  const client = getSupabaseClient()
  if (!client) return MOCK_DEALS

  const { data, error } = await client
    .from('current_deals')
    .select('*')
    .eq('is_180d_low', true)
    .order('deal_score', { ascending: false })
    .limit(100)

  if (error) throw new Error(error.message)
  return data ?? []
}

export function useDeals(filters: DealsFilters) {
  return useQuery({
    queryKey: ['deals', filters],
    queryFn: fetchDeals,
    select: (data) => applyFilters(data, filters),
  })
}

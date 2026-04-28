import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase'
import type { Database } from '@/types/database'
import {
  MOCK_KPI_SUMMARY,
  MOCK_HEATMAP,
  MOCK_TREND,
  type KpiSummary,
  type HeatmapCell,
  type TrendPoint,
} from '@/lib/mock-data'

// ---------------------------------------------------------------------------
// KPI summary — computed from current_deals when Supabase is available
// ---------------------------------------------------------------------------
async function fetchKpiSummary(): Promise<KpiSummary> {
  const client = getSupabaseClient()
  if (!client) return MOCK_KPI_SUMMARY

  type DealRow = Database['public']['Views']['current_deals']['Row']
  const result = await client
    .from('current_deals')
    .select('*')
    .order('deal_score', { ascending: false })
    .limit(200)

  const data = result.data as DealRow[] | null
  const error = result.error

  if (error || !data || data.length === 0) return MOCK_KPI_SUMMARY

  const savings = data.map((d) => {
    const avg = d.avg_price_180d
    const cur = d.current_price
    if (!avg || !cur || avg <= cur) return 0
    return ((avg - cur) / avg) * 100
  })

  const scores = data.map((d) => d.deal_score ?? 0)
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length

  const regionScores: Record<string, number[]> = {}
  for (const d of data) {
    const r = d.region ?? 'otro'
    regionScores[r] ??= []
    regionScores[r].push(d.deal_score ?? 0)
  }
  const bestRegion =
    Object.entries(regionScores)
      .map(([r, sc]) => ({ r, avg: avg(sc) }))
      .sort((a, b) => b.avg - a.avg)[0]?.r ?? '—'

  const cheapestDeal = [...data].sort(
    (a, b) => (a.current_price ?? Infinity) - (b.current_price ?? Infinity),
  )[0]

  return {
    totalActiveDeals: data.length,
    avgSavingsPct: Math.round(avg(savings)),
    bestRegion,
    cheapestPrice: cheapestDeal.current_price ?? 0,
    cheapestItinerary: cheapestDeal.itinerary ?? '—',
    avgDealScore: Math.round(avg(scores)),
  }
}

export function useKpiSummary() {
  return useQuery({
    queryKey: ['insights', 'kpi'],
    queryFn: fetchKpiSummary,
    staleTime: 1000 * 60 * 10,
  })
}

// ---------------------------------------------------------------------------
// Heatmap — seasonal patterns (mock; requires historical aggregation query)
// TODO Phase 9: replace with Supabase RPC that groups price_history_daily
//               by region + month and returns avg deal_score per cell.
// ---------------------------------------------------------------------------
async function fetchHeatmap(): Promise<HeatmapCell[]> {
  return Promise.resolve(MOCK_HEATMAP)
}

export function useHeatmap() {
  return useQuery({
    queryKey: ['insights', 'heatmap'],
    queryFn: fetchHeatmap,
    staleTime: 1000 * 60 * 60,
  })
}

// ---------------------------------------------------------------------------
// 90-day price trend (mock; requires aggregated time-series data)
// TODO Phase 9: replace with Supabase query on price_history_daily
//               grouped by date + region.
// ---------------------------------------------------------------------------
async function fetchTrend(): Promise<TrendPoint[]> {
  return Promise.resolve(MOCK_TREND)
}

export function useTrend() {
  return useQuery({
    queryKey: ['insights', 'trend'],
    queryFn: fetchTrend,
    staleTime: 1000 * 60 * 10,
  })
}

import { useQuery } from '@tanstack/react-query'
import {
  MOCK_KPI_SUMMARY,
  MOCK_HEATMAP,
  MOCK_TREND,
  type KpiSummary,
  type HeatmapCell,
  type TrendPoint,
} from '@/lib/mock-data'

// ---------------------------------------------------------------------------
// KPI summary
// ---------------------------------------------------------------------------
async function fetchKpiSummary(): Promise<KpiSummary> {
  // TODO: replace with Supabase query when integrated
  // const { data } = await supabase.from('current_deals').select('...')
  return Promise.resolve(MOCK_KPI_SUMMARY)
}

export function useKpiSummary() {
  return useQuery({
    queryKey: ['insights', 'kpi'],
    queryFn: fetchKpiSummary,
    staleTime: 1000 * 60 * 10, // 10 min — insights refresh slowly
  })
}

// ---------------------------------------------------------------------------
// Heatmap — region × month avg deal score
// ---------------------------------------------------------------------------
async function fetchHeatmap(): Promise<HeatmapCell[]> {
  // TODO: replace with Supabase aggregation query
  return Promise.resolve(MOCK_HEATMAP)
}

export function useHeatmap() {
  return useQuery({
    queryKey: ['insights', 'heatmap'],
    queryFn: fetchHeatmap,
    staleTime: 1000 * 60 * 60, // 1 hour — historical data
  })
}

// ---------------------------------------------------------------------------
// 90-day price trend by region
// ---------------------------------------------------------------------------
async function fetchTrend(): Promise<TrendPoint[]> {
  // TODO: replace with Supabase query on price_history_daily grouped by region
  return Promise.resolve(MOCK_TREND)
}

export function useTrend() {
  return useQuery({
    queryKey: ['insights', 'trend'],
    queryFn: fetchTrend,
    staleTime: 1000 * 60 * 10,
  })
}

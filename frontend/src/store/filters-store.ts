import { create } from 'zustand'


export type SortBy = 'best' | 'price-asc' | 'price-desc'

export interface DealsFilters {
  region: string
  maxPrice: number | null
  cabinType: string
  minDealScore: number
  sortBy: SortBy
}

interface FiltersStore {
  filters: DealsFilters
  setRegion: (region: string) => void
  setMaxPrice: (price: number | null) => void
  setCabinType: (cabin: string) => void
  setMinDealScore: (score: number) => void
  setSortBy: (sortBy: SortBy) => void
  resetFilters: () => void
}

const DEFAULT_FILTERS: DealsFilters = {
  region: '',
  maxPrice: null,
  cabinType: '',
  minDealScore: 0,
  sortBy: 'best',
}

export const useFiltersStore = create<FiltersStore>((set) => ({
  filters: DEFAULT_FILTERS,

  setRegion: (region) =>
    set((s) => ({ filters: { ...s.filters, region } })),

  setMaxPrice: (maxPrice) =>
    set((s) => ({ filters: { ...s.filters, maxPrice } })),

  setCabinType: (cabinType) =>
    set((s) => ({ filters: { ...s.filters, cabinType } })),

  setMinDealScore: (minDealScore) =>
    set((s) => ({ filters: { ...s.filters, minDealScore } })),

  setSortBy: (sortBy) =>
    set((s) => ({ filters: { ...s.filters, sortBy } })),

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),
}))

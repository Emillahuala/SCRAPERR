import type { Database } from '@/types/database'

type DealRow = Database['public']['Views']['current_deals']['Row']

// ---------------------------------------------------------------------------
// Mock deals — 10 sailings covering several regions and cruise lines
// ---------------------------------------------------------------------------
export const MOCK_DEALS: DealRow[] = [
  {
    sailing_id: 1,
    itinerary_id: 1,
    itinerary: 'Caribe Clásico — 7 noches',
    region: 'caribe',
    duration_nights: 7,
    departure_port: 'Miami',
    cruise_line_id: 1,
    cruise_line: 'Royal Caribbean',
    ship: 'Harmony of the Seas',
    departure_date: '2026-11-14',
    cabin_type: 'Interior',
    current_price: 780,
    min_price_180d: 780,
    avg_price_180d: 1020,
    stddev_180d: 95,
    z_score: -2.53,
    is_180d_low: true,
    days_to_departure: 201,
    captured_at: '2026-04-27T10:00:00Z',
    deal_score: 88,
  },
  {
    sailing_id: 2,
    itinerary_id: 2,
    itinerary: 'Mediterráneo Occidental — 10 noches',
    region: 'mediterraneo',
    duration_nights: 10,
    departure_port: 'Barcelona',
    cruise_line_id: 2,
    cruise_line: 'MSC Cruises',
    ship: 'MSC Bellissima',
    departure_date: '2026-08-22',
    cabin_type: 'Balcón',
    current_price: 1390,
    min_price_180d: 1390,
    avg_price_180d: 1850,
    stddev_180d: 140,
    z_score: -3.29,
    is_180d_low: true,
    days_to_departure: 117,
    captured_at: '2026-04-27T10:00:00Z',
    deal_score: 94,
  },
  {
    sailing_id: 3,
    itinerary_id: 3,
    itinerary: 'Fiordos Escandinavos — 14 noches',
    region: 'fiordos',
    duration_nights: 14,
    departure_port: 'Copenhague',
    cruise_line_id: 3,
    cruise_line: 'Norwegian Cruise Line',
    ship: 'Norwegian Prima',
    departure_date: '2026-07-05',
    cabin_type: 'Suite',
    current_price: 4200,
    min_price_180d: 4200,
    avg_price_180d: 5100,
    stddev_180d: 320,
    z_score: -2.81,
    is_180d_low: true,
    days_to_departure: 69,
    captured_at: '2026-04-27T10:00:00Z',
    deal_score: 76,
  },
  {
    sailing_id: 4,
    itinerary_id: 4,
    itinerary: 'Antillas del Sur — 8 noches',
    region: 'antillas',
    duration_nights: 8,
    departure_port: 'San Juan',
    cruise_line_id: 1,
    cruise_line: 'Royal Caribbean',
    ship: 'Allure of the Seas',
    departure_date: '2026-12-19',
    cabin_type: 'Interior',
    current_price: 890,
    min_price_180d: 890,
    avg_price_180d: 1100,
    stddev_180d: 80,
    z_score: -2.63,
    is_180d_low: true,
    days_to_departure: 236,
    captured_at: '2026-04-27T10:00:00Z',
    deal_score: 82,
  },
  {
    sailing_id: 5,
    itinerary_id: 5,
    itinerary: 'Sudamérica Explorer — 21 noches',
    region: 'sudamerica',
    duration_nights: 21,
    departure_port: 'Buenos Aires',
    cruise_line_id: 4,
    cruise_line: 'Costa Cruises',
    ship: 'Costa Fascinosa',
    departure_date: '2027-01-10',
    cabin_type: 'Océano',
    current_price: 2100,
    min_price_180d: 2100,
    avg_price_180d: 2600,
    stddev_180d: 180,
    z_score: -2.78,
    is_180d_low: true,
    days_to_departure: 258,
    captured_at: '2026-04-27T10:00:00Z',
    deal_score: 79,
  },
  {
    sailing_id: 6,
    itinerary_id: 6,
    itinerary: 'Caribe del Norte — 7 noches',
    region: 'caribe',
    duration_nights: 7,
    departure_port: 'Fort Lauderdale',
    cruise_line_id: 2,
    cruise_line: 'MSC Cruises',
    ship: 'MSC Seashore',
    departure_date: '2026-10-03',
    cabin_type: 'Interior',
    current_price: 650,
    min_price_180d: 650,
    avg_price_180d: 820,
    stddev_180d: 60,
    z_score: -2.83,
    is_180d_low: true,
    days_to_departure: 159,
    captured_at: '2026-04-27T10:00:00Z',
    deal_score: 85,
  },
  {
    sailing_id: 7,
    itinerary_id: 7,
    itinerary: 'Islas Griegas — 12 noches',
    region: 'islas_griegas',
    duration_nights: 12,
    departure_port: 'Atenas (Pireo)',
    cruise_line_id: 5,
    cruise_line: 'Celebrity Cruises',
    ship: 'Celebrity Apex',
    departure_date: '2026-09-14',
    cabin_type: 'Balcón',
    current_price: 2350,
    min_price_180d: 2350,
    avg_price_180d: 3200,
    stddev_180d: 290,
    z_score: -2.93,
    is_180d_low: true,
    days_to_departure: 140,
    captured_at: '2026-04-27T10:00:00Z',
    deal_score: 90,
  },
  {
    sailing_id: 8,
    itinerary_id: 8,
    itinerary: 'Bahamas Escape — 4 noches',
    region: 'bahamas',
    duration_nights: 4,
    departure_port: 'Miami',
    cruise_line_id: 6,
    cruise_line: 'Carnival Cruise Line',
    ship: 'Carnival Horizon',
    departure_date: '2026-06-12',
    cabin_type: 'Interior',
    current_price: 320,
    min_price_180d: 320,
    avg_price_180d: 440,
    stddev_180d: 45,
    z_score: -2.67,
    is_180d_low: true,
    days_to_departure: 46,
    captured_at: '2026-04-27T10:00:00Z',
    deal_score: 72,
  },
  {
    sailing_id: 9,
    itinerary_id: 9,
    itinerary: 'Mediterráneo Oriental — 7 noches',
    region: 'mediterraneo',
    duration_nights: 7,
    departure_port: 'Venecia',
    cruise_line_id: 4,
    cruise_line: 'Costa Cruises',
    ship: 'Costa Smeralda',
    departure_date: '2026-08-01',
    cabin_type: 'Interior',
    current_price: 980,
    min_price_180d: 980,
    avg_price_180d: 1300,
    stddev_180d: 110,
    z_score: -2.91,
    is_180d_low: true,
    days_to_departure: 96,
    captured_at: '2026-04-27T10:00:00Z',
    deal_score: 87,
  },
  {
    sailing_id: 10,
    itinerary_id: 10,
    itinerary: 'Vuelta al Mundo — 105 noches',
    region: 'vuelta_mundo',
    duration_nights: 105,
    departure_port: 'Southampton',
    cruise_line_id: 7,
    cruise_line: 'Cunard',
    ship: 'Queen Mary 2',
    departure_date: '2027-01-06',
    cabin_type: 'Interior',
    current_price: 12500,
    min_price_180d: 12500,
    avg_price_180d: 15800,
    stddev_180d: 1100,
    z_score: -3.0,
    is_180d_low: true,
    days_to_departure: 254,
    captured_at: '2026-04-27T10:00:00Z',
    deal_score: 93,
  },
]

// ---------------------------------------------------------------------------
// Mock price history for sailing #1 — last 60 days
// ---------------------------------------------------------------------------
export interface PriceHistoryPoint {
  date: string
  avg_price: number
  min_price: number
}

function generatePriceHistory(
  _sailingId: number,
  basePrice: number,
  days = 60,
): PriceHistoryPoint[] {
  const history: PriceHistoryPoint[] = []
  const now = new Date('2026-04-27')
  let price = basePrice * 1.35

  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    // simulate a downward drift with random noise
    const noise = (Math.random() - 0.48) * 40
    price = Math.max(basePrice, price + noise - 3)
    history.push({
      date: date.toISOString().slice(0, 10),
      avg_price: Math.round(price),
      min_price: Math.round(price * 0.97),
    })
  }
  return history
}

export const MOCK_PRICE_HISTORY: Record<number, PriceHistoryPoint[]> = {
  1: generatePriceHistory(1, 780),
  2: generatePriceHistory(2, 1390),
  3: generatePriceHistory(3, 4200),
  4: generatePriceHistory(4, 890),
  5: generatePriceHistory(5, 2100),
  6: generatePriceHistory(6, 650),
  7: generatePriceHistory(7, 2350),
  8: generatePriceHistory(8, 320),
  9: generatePriceHistory(9, 980),
  10: generatePriceHistory(10, 12500),
}

// ---------------------------------------------------------------------------
// Mock alerts — 3 alerts for the demo user
// ---------------------------------------------------------------------------
export interface MockAlert {
  id: string
  user_id: string
  region: string | null
  cruise_line_id: number | null
  sailing_id: number | null
  cabin_type: string | null
  max_price_usd: number | null
  min_z_score: number | null
  channel: 'email' | 'telegram' | 'push'
  active: boolean
  created_at: string
}

export const MOCK_ALERTS: MockAlert[] = [
  {
    id: 'alert-1',
    user_id: 'mock-user-id',
    region: 'caribe',
    cruise_line_id: null,
    sailing_id: null,
    cabin_type: 'Interior',
    max_price_usd: 1000,
    min_z_score: -2.0,
    channel: 'email',
    active: true,
    created_at: '2026-04-01T10:00:00Z',
  },
  {
    id: 'alert-2',
    user_id: 'mock-user-id',
    region: null,
    cruise_line_id: 2,
    sailing_id: null,
    cabin_type: null,
    max_price_usd: 2000,
    min_z_score: -2.5,
    channel: 'email',
    active: true,
    created_at: '2026-04-10T14:30:00Z',
  },
  {
    id: 'alert-3',
    user_id: 'mock-user-id',
    region: null,
    cruise_line_id: null,
    sailing_id: 3,
    cabin_type: 'Suite',
    max_price_usd: 5000,
    min_z_score: -2.0,
    channel: 'email',
    active: false,
    created_at: '2026-04-15T09:00:00Z',
  },
]

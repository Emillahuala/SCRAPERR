// AUTO-GENERATED STUB — regenerar con `supabase gen types typescript --project-id <id>`
// cuando integremos Supabase real. Mientras tanto, refleja el schema definido en
// infra/supabase/migrations/0001-0006.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      cruise_lines: {
        Row: {
          id: number
          name: string
          rating: number | null
          source_url: string | null
        }
        Insert: {
          id?: number
          name: string
          rating?: number | null
          source_url?: string | null
        }
        Update: {
          id?: number
          name?: string
          rating?: number | null
          source_url?: string | null
        }
      }
      ships: {
        Row: {
          id: number
          cruise_line_id: number | null
          name: string
        }
        Insert: {
          id?: number
          cruise_line_id?: number | null
          name: string
        }
        Update: {
          id?: number
          cruise_line_id?: number | null
          name?: string
        }
      }
      itineraries: {
        Row: {
          id: number
          ship_id: number | null
          name: string
          duration_nights: number
          departure_port: string
          region: string
          ports_of_call: string[] | null
          hash_key: string
          created_at: string | null
        }
        Insert: {
          id?: number
          ship_id?: number | null
          name: string
          duration_nights: number
          departure_port: string
          region: string
          ports_of_call?: string[] | null
          hash_key: string
          created_at?: string | null
        }
        Update: {
          id?: number
          ship_id?: number | null
          name?: string
          duration_nights?: number
          departure_port?: string
          region?: string
          ports_of_call?: string[] | null
          hash_key?: string
          created_at?: string | null
        }
      }
      sailings: {
        Row: {
          id: number
          itinerary_id: number | null
          departure_date: string
          source_url: string
          source_id: string | null
          active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: number
          itinerary_id?: number | null
          departure_date: string
          source_url: string
          source_id?: string | null
          active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: number
          itinerary_id?: number | null
          departure_date?: string
          source_url?: string
          source_id?: string | null
          active?: boolean | null
          created_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          display_name: string | null
          telegram_chat_id: string | null
          preferences: Json | null
          created_at: string | null
        }
        Insert: {
          id: string
          display_name?: string | null
          telegram_chat_id?: string | null
          preferences?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          display_name?: string | null
          telegram_chat_id?: string | null
          preferences?: Json | null
          created_at?: string | null
        }
      }
      alerts: {
        Row: {
          id: string
          user_id: string
          region: string | null
          cruise_line_id: number | null
          sailing_id: number | null
          cabin_type: string | null
          max_price_usd: number | null
          min_z_score: number | null
          channel: 'email' | 'telegram' | 'push'
          active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          region?: string | null
          cruise_line_id?: number | null
          sailing_id?: number | null
          cabin_type?: string | null
          max_price_usd?: number | null
          min_z_score?: number | null
          channel?: 'email' | 'telegram' | 'push'
          active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          region?: string | null
          cruise_line_id?: number | null
          sailing_id?: number | null
          cabin_type?: string | null
          max_price_usd?: number | null
          min_z_score?: number | null
          channel?: 'email' | 'telegram' | 'push'
          active?: boolean | null
          created_at?: string | null
        }
      }
      price_history: {
        Row: {
          sailing_id: number
          cabin_type: string
          price_usd: number
          price_clp: number | null
          available: boolean | null
          captured_at: string
        }
        Insert: {
          sailing_id: number
          cabin_type: string
          price_usd: number
          price_clp?: number | null
          available?: boolean | null
          captured_at?: string
        }
        Update: {
          sailing_id?: number
          cabin_type?: string
          price_usd?: number
          price_clp?: number | null
          available?: boolean | null
          captured_at?: string
        }
      }
      price_history_daily: {
        Row: {
          sailing_id: number
          cabin_type: string
          date: string
          min_price: number | null
          max_price: number | null
          avg_price: number | null
          sample_count: number | null
        }
        Insert: {
          sailing_id: number
          cabin_type: string
          date: string
          min_price?: number | null
          max_price?: number | null
          avg_price?: number | null
          sample_count?: number | null
        }
        Update: {
          sailing_id?: number
          cabin_type?: string
          date?: string
          min_price?: number | null
          max_price?: number | null
          avg_price?: number | null
          sample_count?: number | null
        }
      }
      alert_matches: {
        Row: {
          id: number
          alert_id: string
          user_id: string
          sailing_id: number
          cabin_type: string
          price_usd: number | null
          z_score: number | null
          deal_score: number | null
          notified: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: number
          alert_id: string
          user_id: string
          sailing_id: number
          cabin_type: string
          price_usd?: number | null
          z_score?: number | null
          deal_score?: number | null
          notified?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: number
          alert_id?: string
          user_id?: string
          sailing_id?: number
          cabin_type?: string
          price_usd?: number | null
          z_score?: number | null
          deal_score?: number | null
          notified?: boolean | null
          created_at?: string | null
        }
      }
    }
    Views: {
      current_deals: {
        Row: {
          sailing_id: number | null
          itinerary_id: number | null
          itinerary: string | null
          region: string | null
          duration_nights: number | null
          departure_port: string | null
          cruise_line_id: number | null
          cruise_line: string | null
          ship: string | null
          departure_date: string | null
          cabin_type: string | null
          current_price: number | null
          min_price_180d: number | null
          avg_price_180d: number | null
          stddev_180d: number | null
          z_score: number | null
          is_180d_low: boolean | null
          days_to_departure: number | null
          captured_at: string | null
          deal_score: number | null
        }
      }
    }
    Functions: {
      refresh_current_deals: {
        Args: Record<string, never>
        Returns: undefined
      }
    }
    Enums: Record<string, never>
  }
}

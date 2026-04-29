// AUTO-GENERATED — supabase gen types typescript --project-id ikaahdtbmbjbmtctydgf
// Regenerar cuando cambien las migraciones.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alert_matches: {
        Row: {
          alert_id: string
          cabin_type: string
          created_at: string | null
          deal_score: number | null
          id: number
          notified: boolean | null
          price_usd: number | null
          sailing_id: number
          user_id: string
          z_score: number | null
        }
        Insert: {
          alert_id: string
          cabin_type: string
          created_at?: string | null
          deal_score?: number | null
          id?: number
          notified?: boolean | null
          price_usd?: number | null
          sailing_id: number
          user_id: string
          z_score?: number | null
        }
        Update: {
          alert_id?: string
          cabin_type?: string
          created_at?: string | null
          deal_score?: number | null
          id?: number
          notified?: boolean | null
          price_usd?: number | null
          sailing_id?: number
          user_id?: string
          z_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_matches_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_matches_sailing_id_fkey"
            columns: ["sailing_id"]
            isOneToOne: false
            referencedRelation: "current_deals"
            referencedColumns: ["sailing_id"]
          },
          {
            foreignKeyName: "alert_matches_sailing_id_fkey"
            columns: ["sailing_id"]
            isOneToOne: false
            referencedRelation: "sailings"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          active: boolean | null
          cabin_type: string | null
          channel: string | null
          created_at: string | null
          cruise_line_id: number | null
          id: string
          max_price_usd: number | null
          min_z_score: number | null
          region: string | null
          sailing_id: number | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          cabin_type?: string | null
          channel?: string | null
          created_at?: string | null
          cruise_line_id?: number | null
          id?: string
          max_price_usd?: number | null
          min_z_score?: number | null
          region?: string | null
          sailing_id?: number | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          cabin_type?: string | null
          channel?: string | null
          created_at?: string | null
          cruise_line_id?: number | null
          id?: string
          max_price_usd?: number | null
          min_z_score?: number | null
          region?: string | null
          sailing_id?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_cruise_line_id_fkey"
            columns: ["cruise_line_id"]
            isOneToOne: false
            referencedRelation: "cruise_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_cruise_line_id_fkey"
            columns: ["cruise_line_id"]
            isOneToOne: false
            referencedRelation: "current_deals"
            referencedColumns: ["cruise_line_id"]
          },
          {
            foreignKeyName: "alerts_sailing_id_fkey"
            columns: ["sailing_id"]
            isOneToOne: false
            referencedRelation: "current_deals"
            referencedColumns: ["sailing_id"]
          },
          {
            foreignKeyName: "alerts_sailing_id_fkey"
            columns: ["sailing_id"]
            isOneToOne: false
            referencedRelation: "sailings"
            referencedColumns: ["id"]
          },
        ]
      }
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
        Relationships: []
      }
      itineraries: {
        Row: {
          created_at: string | null
          departure_port: string
          duration_nights: number
          hash_key: string
          id: number
          name: string
          ports_of_call: string[] | null
          region: string
          ship_id: number | null
        }
        Insert: {
          created_at?: string | null
          departure_port: string
          duration_nights: number
          hash_key: string
          id?: number
          name: string
          ports_of_call?: string[] | null
          region: string
          ship_id?: number | null
        }
        Update: {
          created_at?: string | null
          departure_port?: string
          duration_nights?: number
          hash_key?: string
          id?: number
          name?: string
          ports_of_call?: string[] | null
          region?: string
          ship_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "itineraries_ship_id_fkey"
            columns: ["ship_id"]
            isOneToOne: false
            referencedRelation: "ships"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          available: boolean | null
          cabin_type: string
          captured_at: string
          price_clp: number | null
          price_usd: number
          sailing_id: number
        }
        Insert: {
          available?: boolean | null
          cabin_type: string
          captured_at?: string
          price_clp?: number | null
          price_usd: number
          sailing_id: number
        }
        Update: {
          available?: boolean | null
          cabin_type?: string
          captured_at?: string
          price_clp?: number | null
          price_usd?: number
          sailing_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "price_history_sailing_id_fkey"
            columns: ["sailing_id"]
            isOneToOne: false
            referencedRelation: "current_deals"
            referencedColumns: ["sailing_id"]
          },
          {
            foreignKeyName: "price_history_sailing_id_fkey"
            columns: ["sailing_id"]
            isOneToOne: false
            referencedRelation: "sailings"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history_2026_04: {
        Row: {
          available: boolean | null
          cabin_type: string
          captured_at: string
          price_clp: number | null
          price_usd: number
          sailing_id: number
        }
        Insert: {
          available?: boolean | null
          cabin_type: string
          captured_at?: string
          price_clp?: number | null
          price_usd: number
          sailing_id: number
        }
        Update: {
          available?: boolean | null
          cabin_type?: string
          captured_at?: string
          price_clp?: number | null
          price_usd?: number
          sailing_id?: number
        }
        Relationships: []
      }
      price_history_2026_05: {
        Row: {
          available: boolean | null
          cabin_type: string
          captured_at: string
          price_clp: number | null
          price_usd: number
          sailing_id: number
        }
        Insert: {
          available?: boolean | null
          cabin_type: string
          captured_at?: string
          price_clp?: number | null
          price_usd: number
          sailing_id: number
        }
        Update: {
          available?: boolean | null
          cabin_type?: string
          captured_at?: string
          price_clp?: number | null
          price_usd?: number
          sailing_id?: number
        }
        Relationships: []
      }
      price_history_daily: {
        Row: {
          avg_price: number | null
          cabin_type: string
          date: string
          max_price: number | null
          min_price: number | null
          sailing_id: number
          sample_count: number | null
        }
        Insert: {
          avg_price?: number | null
          cabin_type: string
          date: string
          max_price?: number | null
          min_price?: number | null
          sailing_id: number
          sample_count?: number | null
        }
        Update: {
          avg_price?: number | null
          cabin_type?: string
          date?: string
          max_price?: number | null
          min_price?: number | null
          sailing_id?: number
          sample_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "price_history_daily_sailing_id_fkey"
            columns: ["sailing_id"]
            isOneToOne: false
            referencedRelation: "current_deals"
            referencedColumns: ["sailing_id"]
          },
          {
            foreignKeyName: "price_history_daily_sailing_id_fkey"
            columns: ["sailing_id"]
            isOneToOne: false
            referencedRelation: "sailings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          id: string
          preferences: Json | null
          telegram_chat_id: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          id: string
          preferences?: Json | null
          telegram_chat_id?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          preferences?: Json | null
          telegram_chat_id?: string | null
        }
        Relationships: []
      }
      sailings: {
        Row: {
          active: boolean | null
          created_at: string | null
          departure_date: string
          id: number
          itinerary_id: number | null
          source_id: string | null
          source_url: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          departure_date: string
          id?: number
          itinerary_id?: number | null
          source_id?: string | null
          source_url: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          departure_date?: string
          id?: number
          itinerary_id?: number | null
          source_id?: string | null
          source_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "sailings_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "current_deals"
            referencedColumns: ["itinerary_id"]
          },
          {
            foreignKeyName: "sailings_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
        ]
      }
      ships: {
        Row: {
          cruise_line_id: number | null
          id: number
          name: string
        }
        Insert: {
          cruise_line_id?: number | null
          id?: number
          name: string
        }
        Update: {
          cruise_line_id?: number | null
          id?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "ships_cruise_line_id_fkey"
            columns: ["cruise_line_id"]
            isOneToOne: false
            referencedRelation: "cruise_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ships_cruise_line_id_fkey"
            columns: ["cruise_line_id"]
            isOneToOne: false
            referencedRelation: "current_deals"
            referencedColumns: ["cruise_line_id"]
          },
        ]
      }
    }
    Views: {
      current_deals: {
        Row: {
          avg_price_180d: number | null
          cabin_type: string | null
          captured_at: string | null
          cruise_line: string | null
          cruise_line_id: number | null
          current_price: number | null
          days_to_departure: number | null
          deal_score: number | null
          departure_date: string | null
          departure_port: string | null
          duration_nights: number | null
          is_180d_low: boolean | null
          itinerary: string | null
          itinerary_id: number | null
          min_price_180d: number | null
          region: string | null
          sailing_id: number | null
          ship: string | null
          source_url: string | null
          stddev_180d: number | null
          z_score: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      ensure_price_history_partition: {
        Args: { target_month: string }
        Returns: undefined
      }
      refresh_current_deals: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

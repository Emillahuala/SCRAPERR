/**
 * Supabase client — gracefully degrades when env vars are absent (dev/mock mode).
 * Swap mock hooks for real ones once Supabase is wired up.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

let _client: SupabaseClient<Database> | null = null

function getClient(): SupabaseClient<Database> | null {
  if (!supabaseUrl || !supabaseAnonKey) return null
  if (!_client) {
    _client = createClient<Database>(supabaseUrl, supabaseAnonKey)
  }
  return _client
}

export { getClient as getSupabaseClient }

/** Returns true when env vars are present and client is available. */
export function isSupabaseReady(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

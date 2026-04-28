// refresh-deals
//
// Trigger:
//   - HTTP POST from GitHub Actions after each scraping run
//   - Also scheduled by pg_cron every hour (defense in depth)
//
// Responsibilities:
//   1. Refresh the `current_deals` materialized view via the
//      `refresh_current_deals` RPC.
//   2. Detect deals where `is_180d_low = true` captured in the last 6h.
//   3. Cross-reference with active alerts (region / cruise_line / sailing
//      targeting + cabin_type / max_price / min_z_score thresholds).
//   4. Insert matches into `alert_matches`.
//   5. Fire-and-forget invoke `dispatch-notifications` for each new match.

import { createClient, SupabaseClient } from '@supabase/supabase-js'

interface Deal {
  sailing_id: number
  region: string | null
  cruise_line_id: number | null
  cabin_type: string
  current_price: number
  z_score: number | null
  deal_score: number
  itinerary: string
  cruise_line: string
  ship: string
  departure_date: string
  avg_price_180d: number | null
  days_to_departure: number
}

interface Alert {
  id: string
  user_id: string
  channel: 'email' | 'telegram' | 'push'
  region: string | null
  cruise_line_id: number | null
  sailing_id: number | null
  cabin_type: string | null
  max_price_usd: number | null
  min_z_score: number | null
}

interface RefreshResult {
  refreshed: boolean
  new_lows_detected: number
  matches_created: number
}

Deno.serve(async (_req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ error: 'missing supabase env vars' }, 500)
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  // 1. Refresh the materialized view.
  const { error: refreshError } = await supabase.rpc('refresh_current_deals')
  if (refreshError) {
    return jsonResponse({ error: `refresh failed: ${refreshError.message}` }, 500)
  }

  // 2. Detect new 180-day lows in the last 6 hours.
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  const { data: newLows, error: lowsError } = await supabase
    .from('current_deals')
    .select('*')
    .eq('is_180d_low', true)
    .gte('captured_at', sixHoursAgo)

  if (lowsError) {
    return jsonResponse({ error: `lows query failed: ${lowsError.message}` }, 500)
  }

  if (!newLows || newLows.length === 0) {
    return jsonResponse(buildResult(true, 0, 0))
  }

  // 3 + 4 + 5. For each new low, find matching alerts, insert match, dispatch.
  let matchesCreated = 0
  for (const deal of newLows as Deal[]) {
    const matches = await findMatchingAlerts(supabase, deal)
    for (const alert of matches) {
      const inserted = await insertMatch(supabase, alert, deal)
      if (!inserted) continue

      matchesCreated++
      // Fire-and-forget: don't block the loop if Resend is slow/down.
      supabase.functions
        .invoke('dispatch-notifications', { body: { alert_id: alert.id, deal } })
        .catch((err) => console.error('dispatch_invoke_failed', err))
    }
  }

  return jsonResponse(buildResult(true, newLows.length, matchesCreated))
})

async function findMatchingAlerts(
  supabase: SupabaseClient,
  deal: Deal,
): Promise<Alert[]> {
  // Build the targeting filter dynamically — only include criteria that exist
  // on this deal. At least sailing_id is always present.
  const orParts: string[] = [`sailing_id.eq.${deal.sailing_id}`]
  if (deal.region) orParts.push(`region.eq.${deal.region}`)
  if (deal.cruise_line_id) orParts.push(`cruise_line_id.eq.${deal.cruise_line_id}`)

  const { data, error } = await supabase
    .from('alerts')
    .select(
      'id, user_id, channel, region, cruise_line_id, sailing_id, cabin_type, max_price_usd, min_z_score',
    )
    .eq('active', true)
    .or(orParts.join(','))

  if (error) {
    console.error('alerts_query_failed', error)
    return []
  }

  // Apply threshold filters in code so the SQL stays simple and readable.
  return (data ?? []).filter((alert: Alert) => {
    if (alert.cabin_type && alert.cabin_type !== deal.cabin_type) return false
    if (alert.max_price_usd !== null && deal.current_price > alert.max_price_usd) {
      return false
    }
    if (alert.min_z_score !== null && (deal.z_score ?? 0) > alert.min_z_score) {
      return false
    }
    return true
  })
}

async function insertMatch(
  supabase: SupabaseClient,
  alert: Alert,
  deal: Deal,
): Promise<boolean> {
  const { error } = await supabase.from('alert_matches').insert({
    alert_id: alert.id,
    user_id: alert.user_id,
    sailing_id: deal.sailing_id,
    cabin_type: deal.cabin_type,
    price_usd: deal.current_price,
    z_score: deal.z_score,
    deal_score: deal.deal_score,
  })
  if (error) {
    console.error('alert_match_insert_failed', { alert_id: alert.id, error })
    return false
  }
  return true
}

function buildResult(
  refreshed: boolean,
  newLowsDetected: number,
  matchesCreated: number,
): RefreshResult {
  return {
    refreshed,
    new_lows_detected: newLowsDetected,
    matches_created: matchesCreated,
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

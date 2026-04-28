// dispatch-notifications
//
// Trigger: invoked by `refresh-deals` for each new alert_match.
//
// Responsibilities:
//   1. Look up the alert + recipient email.
//   2. Send the channel-appropriate notification (email via Resend; telegram
//      and push are TODO).
//   3. Mark the alert_matches row notified=true.

import { createClient } from '@supabase/supabase-js'

interface DealPayload {
  sailing_id: number
  itinerary: string
  cruise_line: string
  ship: string
  departure_date: string
  cabin_type: string
  current_price: number
  avg_price_180d: number | null
  z_score: number | null
  deal_score: number
  days_to_departure: number
}

interface NotificationPayload {
  alert_id: string
  deal: DealPayload
}

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const resendKey = Deno.env.get('RESEND_API_KEY')

  if (!supabaseUrl || !serviceKey || !resendKey) {
    return new Response('missing env vars', { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  const payload = (await req.json()) as NotificationPayload

  // 1. Look up the alert (channel + user_id).
  const { data: alert, error: alertError } = await supabase
    .from('alerts')
    .select('id, user_id, channel')
    .eq('id', payload.alert_id)
    .single()

  if (alertError || !alert) {
    return new Response('alert not found', { status: 404 })
  }

  // 2. Get the recipient's email from auth.users (via admin API).
  const { data: userData, error: userError } =
    await supabase.auth.admin.getUserById(alert.user_id)
  const email = userData?.user?.email
  if (userError || !email) {
    return new Response('user email missing', { status: 404 })
  }

  // 3. Dispatch on the chosen channel.
  if (alert.channel === 'email') {
    try {
      await sendEmail(email, payload.deal, resendKey)
    } catch (err) {
      console.error('email_send_failed', err)
      return new Response(`email send failed: ${err}`, { status: 502 })
    }
  } else {
    // TODO: telegram, push (Phase 12)
    console.warn('channel_not_implemented', { channel: alert.channel })
  }

  // 4. Mark this match as notified.
  const { error: updateError } = await supabase
    .from('alert_matches')
    .update({ notified: true })
    .eq('alert_id', payload.alert_id)
    .eq('sailing_id', payload.deal.sailing_id)
    .eq('cabin_type', payload.deal.cabin_type)

  if (updateError) {
    console.error('mark_notified_failed', updateError)
  }

  return new Response('ok')
})

async function sendEmail(
  to: string,
  deal: DealPayload,
  resendKey: string,
): Promise<void> {
  const fromAddress = Deno.env.get('FROM_EMAIL') ?? 'alerts@offerhunter.app'
  const frontendUrl =
    Deno.env.get('FRONTEND_URL') ?? 'https://offerhunter.vercel.app'

  const savings =
    deal.avg_price_180d && deal.avg_price_180d > 0
      ? Math.round(((deal.avg_price_180d - deal.current_price) / deal.avg_price_180d) * 100)
      : 0

  const html = renderEmailHtml(deal, savings, frontendUrl)
  const subject = `🎯 Oferta detectada: ${deal.cruise_line} ${deal.itinerary}`

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress,
      to,
      subject,
      html,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Resend ${response.status}: ${errorBody}`)
  }
}

function renderEmailHtml(
  deal: DealPayload,
  savings: number,
  frontendUrl: string,
): string {
  const sailingUrl = `${frontendUrl}/sailing/${deal.sailing_id}`
  const avgPrice = deal.avg_price_180d?.toFixed(0) ?? 'N/A'

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #0f172a;">🎯 Mínimo en 6 meses detectado</h1>
      <p style="font-size: 18px;">
        <strong>${escapeHtml(deal.cruise_line)}</strong> — ${escapeHtml(deal.ship)}<br>
        ${escapeHtml(deal.itinerary)}
      </p>
      <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
        ${row('Fecha de zarpe', escapeHtml(deal.departure_date))}
        ${row('Cabina', escapeHtml(deal.cabin_type))}
        ${row('Precio actual', `<strong>USD ${deal.current_price}</strong>`)}
        ${row('Promedio 6 meses', `USD ${avgPrice}`)}
        ${row('Ahorro estimado', `<span style="color: #059669;"><strong>${savings}%</strong></span>`)}
      </table>
      <a href="${sailingUrl}"
         style="display: inline-block; padding: 12px 24px; background: #0891b2; color: white; text-decoration: none; border-radius: 6px;">
        Ver detalle en OfferHunter
      </a>
    </div>
  `
}

function row(label: string, value: string): string {
  return `
    <tr>
      <td style="padding: 12px; border: 1px solid #e2e8f0;">${escapeHtml(label)}</td>
      <td style="padding: 12px; border: 1px solid #e2e8f0;">${value}</td>
    </tr>
  `
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c] ?? c)
}

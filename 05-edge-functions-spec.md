# Edge Functions de Supabase

Funciones serverless en **Deno + TypeScript** que viven en `infra/supabase/functions/`.
Reemplazan al servicio Python de análisis/notificaciones porque son gratis y rápidas.

## Funciones a implementar

### 1. `refresh-deals`
**Disparador**: webhook desde GitHub Actions tras finalizar scraping (HTTP POST).
**También**: pg_cron cada hora.

**Responsabilidad**:
1. Refrescar la vista materializada `current_deals`.
2. Detectar `is_180d_low = true` aparecidos desde la última ejecución.
3. Cruzar con tabla `alerts` y producir matches.
4. Insertar en `alert_matches` (tabla nueva, ver abajo).

```typescript
// infra/supabase/functions/refresh-deals/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RefreshResult {
  refreshed: boolean
  new_lows_detected: number
  matches_created: number
}

Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 1. Refresh vista materializada
  const { error: refreshError } = await supabase.rpc('refresh_current_deals')
  if (refreshError) {
    return new Response(JSON.stringify({ error: refreshError.message }),
      { status: 500 })
  }

  // 2. Detectar nuevos mínimos en últimas 6 horas
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  const { data: newLows, error: lowsError } = await supabase
    .from('current_deals')
    .select('*')
    .eq('is_180d_low', true)
    .gte('captured_at', sixHoursAgo)

  if (lowsError) {
    return new Response(JSON.stringify({ error: lowsError.message }),
      { status: 500 })
  }

  if (!newLows?.length) {
    const result: RefreshResult = {
      refreshed: true,
      new_lows_detected: 0,
      matches_created: 0,
    }
    return new Response(JSON.stringify(result))
  }

  // 3. Cruzar con alertas activas
  let matchesCreated = 0
  for (const deal of newLows) {
    const { data: matchingAlerts } = await supabase
      .from('alerts')
      .select('id, user_id, channel, max_price_usd, min_z_score')
      .eq('active', true)
      .or(`sailing_id.eq.${deal.sailing_id},region.eq.${deal.region}`)

    if (!matchingAlerts) continue

    for (const alert of matchingAlerts) {
      // Validar criterios adicionales
      if (alert.max_price_usd && deal.current_price > alert.max_price_usd) continue
      if (alert.min_z_score && (deal.z_score ?? 0) > alert.min_z_score) continue

      // Insertar match
      const { error } = await supabase.from('alert_matches').insert({
        alert_id: alert.id,
        user_id: alert.user_id,
        sailing_id: deal.sailing_id,
        cabin_type: deal.cabin_type,
        price_usd: deal.current_price,
        z_score: deal.z_score,
        deal_score: deal.deal_score,
      })

      if (!error) {
        matchesCreated++
        // Disparar notificación async
        await supabase.functions.invoke('dispatch-notifications', {
          body: { alert_id: alert.id, deal },
        })
      }
    }
  }

  const result: RefreshResult = {
    refreshed: true,
    new_lows_detected: newLows.length,
    matches_created: matchesCreated,
  }
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

**Tabla auxiliar requerida** (añadir a migración 0006):
```sql
create table if not exists alert_matches (
  id          bigserial primary key,
  alert_id    uuid not null references alerts(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  sailing_id  bigint not null references sailings(id) on delete cascade,
  cabin_type  text not null,
  price_usd   numeric(10,2),
  z_score     numeric(3,2),
  deal_score  int,
  notified    boolean default false,
  created_at  timestamptz default now()
);
create index on alert_matches(user_id, created_at desc);

alter table alert_matches enable row level security;
create policy "users see own matches" on alert_matches
  for select using (auth.uid() = user_id);
```

**RPC para refrescar la vista** (añadir a migración 0006):
```sql
create or replace function refresh_current_deals()
returns void language plpgsql security definer as $$
begin
  refresh materialized view concurrently current_deals;
end $$;
```

### 2. `dispatch-notifications`
**Disparador**: invocada por `refresh-deals` cuando hay match.

**Responsabilidad**:
- Enviar email vía Resend con template HTML que muestra la oferta.
- Marcar `alert_matches.notified = true`.
- Soportar canal `telegram` opcionalmente.

```typescript
// infra/supabase/functions/dispatch-notifications/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface NotificationPayload {
  alert_id: string
  deal: {
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
}

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { alert_id, deal }: NotificationPayload = await req.json()

  // Obtener email del usuario y configuración del alert
  const { data: alert } = await supabase
    .from('alerts')
    .select('user_id, channel, profiles!inner(display_name)')
    .eq('id', alert_id)
    .single()

  if (!alert) {
    return new Response('alert not found', { status: 404 })
  }

  const { data: { user } } = await supabase.auth.admin.getUserById(alert.user_id)
  if (!user?.email) {
    return new Response('user email missing', { status: 404 })
  }

  if (alert.channel === 'email') {
    await sendEmail(user.email, deal)
  }
  // TODO: Telegram, push

  // Marcar match como notificado
  await supabase
    .from('alert_matches')
    .update({ notified: true })
    .eq('alert_id', alert_id)
    .eq('sailing_id', deal.sailing_id)
    .eq('cabin_type', deal.cabin_type)

  return new Response('ok')
})

async function sendEmail(to: string, deal: NotificationPayload['deal']): Promise<void> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')!
  const fromAddress = Deno.env.get('FROM_EMAIL') ?? 'alerts@offerhunter.app'

  const savings = deal.avg_price_180d
    ? Math.round(((deal.avg_price_180d - deal.current_price) / deal.avg_price_180d) * 100)
    : 0

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #0f172a;">🎯 Mínimo en 6 meses detectado</h1>
      <p style="font-size: 18px;">
        <strong>${deal.cruise_line}</strong> — ${deal.ship}<br>
        ${deal.itinerary}
      </p>
      <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
        <tr>
          <td style="padding: 12px; border: 1px solid #e2e8f0;">Fecha de zarpe</td>
          <td style="padding: 12px; border: 1px solid #e2e8f0;">${deal.departure_date}</td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #e2e8f0;">Cabina</td>
          <td style="padding: 12px; border: 1px solid #e2e8f0;">${deal.cabin_type}</td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #e2e8f0;">Precio actual</td>
          <td style="padding: 12px; border: 1px solid #e2e8f0;"><strong>USD ${deal.current_price}</strong></td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #e2e8f0;">Promedio 6 meses</td>
          <td style="padding: 12px; border: 1px solid #e2e8f0;">USD ${deal.avg_price_180d?.toFixed(0) ?? 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #e2e8f0;">Ahorro estimado</td>
          <td style="padding: 12px; border: 1px solid #e2e8f0; color: #059669;"><strong>${savings}%</strong></td>
        </tr>
      </table>
      <a href="${Deno.env.get('FRONTEND_URL')}/sailing/${deal.sailing_id}"
         style="display: inline-block; padding: 12px 24px; background: #0891b2; color: white; text-decoration: none; border-radius: 6px;">
        Ver detalle en OfferHunter
      </a>
    </div>
  `

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress,
      to,
      subject: `🎯 Oferta detectada: ${deal.cruise_line} ${deal.itinerary}`,
      html,
    }),
  })

  if (!response.ok) {
    throw new Error(`Resend error: ${await response.text()}`)
  }
}
```

## Variables de entorno requeridas

En el dashboard de Supabase → Edge Functions → Secrets:

```
SUPABASE_URL=...                # auto
SUPABASE_SERVICE_ROLE_KEY=...   # auto
RESEND_API_KEY=re_...
FROM_EMAIL=alerts@tudominio.com
FRONTEND_URL=https://offerhunter.vercel.app
```

## Comandos de despliegue

```bash
# Desplegar una función
supabase functions deploy refresh-deals
supabase functions deploy dispatch-notifications

# Configurar secretos
supabase secrets set RESEND_API_KEY=re_xxx
supabase secrets set FROM_EMAIL=alerts@tudominio.com
supabase secrets set FRONTEND_URL=https://offerhunter.vercel.app

# Probar localmente
supabase functions serve refresh-deals --env-file .env.local
curl -X POST http://localhost:54321/functions/v1/refresh-deals
```

## Tests
Las Edge Functions se testean con:
- **Deno test runner** para lógica pura.
- **Mock de Supabase client** para integración.
- Smoke test post-deploy con `curl` desde GitHub Actions.

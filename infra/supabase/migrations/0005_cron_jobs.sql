-- 0005_cron_jobs.sql
-- pg_cron: jobs programados dentro de Postgres.
-- Requiere extensión pg_cron habilitada en el dashboard de Supabase
-- (Database → Extensions → pg_cron).

-- Refrescar la vista materializada cada hora.
-- (Edge Function refresh-deals la refresca también on-demand post-scraping.)
select cron.schedule(
  'refresh-current-deals',
  '0 * * * *',
  $$ refresh materialized view concurrently current_deals $$
);

-- Crear partición del próximo mes el día 25 de cada mes.
-- Ventana de seguridad: si el cron falla, todavía hay 6 días para arreglarlo.
select cron.schedule(
  'create-next-partition',
  '0 0 25 * *',
  $$ select ensure_price_history_partition(current_date + interval '1 month') $$
);

-- Agregación nocturna: copia datos > 6 meses a price_history_daily.
-- No borra los datos originales (eso es decisión del operador, drop partition manual).
select cron.schedule(
  'aggregate-old-prices',
  '0 3 * * *',
  $$
  insert into price_history_daily (sailing_id, cabin_type, date, min_price, max_price, avg_price, sample_count)
  select sailing_id, cabin_type, captured_at::date,
         min(price_usd), max(price_usd), avg(price_usd), count(*)
  from price_history
  where captured_at < now() - interval '6 months'
  group by sailing_id, cabin_type, captured_at::date
  on conflict (sailing_id, cabin_type, date) do nothing;
  $$
);

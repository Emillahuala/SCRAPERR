-- 0003_materialized_view.sql
-- Vista materializada current_deals: combina último precio capturado de cada
-- (sailing, cabin) con estadísticas de la ventana de 180 días.
-- Refrescada por pg_cron cada hora (ver 0005) y on-demand por refresh-deals.
-- deal_score 0-100: más alto = mejor oferta (50 = precio promedio, 100 = -2σ del avg).

create materialized view if not exists current_deals as
select
  s.id as sailing_id,
  i.id as itinerary_id,
  i.name as itinerary,
  i.region,
  i.duration_nights,
  i.departure_port,
  cl.id as cruise_line_id,
  cl.name as cruise_line,
  sh.name as ship,
  s.departure_date,
  ph.cabin_type,
  ph.price_usd as current_price,
  hist.min_price_180d,
  hist.avg_price_180d,
  hist.stddev_180d,
  case when hist.stddev_180d > 0
    then round((ph.price_usd - hist.avg_price_180d) / hist.stddev_180d, 2)
  end as z_score,
  ph.price_usd <= coalesce(hist.min_price_180d, ph.price_usd) as is_180d_low,
  s.departure_date - current_date as days_to_departure,
  ph.captured_at,
  greatest(0, least(100, round(
    case
      when hist.stddev_180d is null or hist.stddev_180d = 0 then 50
      else 50 - ((ph.price_usd - hist.avg_price_180d) / hist.stddev_180d) * 25
    end
  )::int)) as deal_score
from sailings s
join itineraries i on i.id = s.itinerary_id
join ships sh on sh.id = i.ship_id
join cruise_lines cl on cl.id = sh.cruise_line_id
join lateral (
  select price_usd, cabin_type, captured_at
  from price_history
  where sailing_id = s.id
  order by captured_at desc limit 1
) ph on true
join lateral (
  select
    min(price_usd) as min_price_180d,
    avg(price_usd) as avg_price_180d,
    stddev(price_usd) as stddev_180d,
    count(*) as sample_count
  from price_history
  where sailing_id = s.id
    and cabin_type = ph.cabin_type
    and captured_at > now() - interval '180 days'
) hist on true
where s.active = true
  and s.departure_date >= current_date;

-- Índice único requerido para REFRESH MATERIALIZED VIEW CONCURRENTLY.
create unique index if not exists idx_current_deals_unique
  on current_deals (sailing_id, cabin_type);
create index if not exists idx_current_deals_score
  on current_deals (deal_score desc);
create index if not exists idx_current_deals_region
  on current_deals (region, deal_score desc);

-- 0009_add_available_to_price_history_daily.sql
-- Agrega columna available a price_history_daily y crea función RPC con
-- merge real: LEAST/GREATEST para min/max, weighted avg para avg_price.

alter table price_history_daily
  add column if not exists available boolean default true;

-- RPC que hace el upsert con merge correcto.
-- Llamada desde el pipeline en lugar del upsert directo.
create or replace function upsert_price_history_daily(
  p_sailing_id  bigint,
  p_cabin_type  text,
  p_date        date,
  p_price       numeric,
  p_available   boolean
) returns void language plpgsql as $$
begin
  insert into price_history_daily
    (sailing_id, cabin_type, date, min_price, max_price, avg_price, sample_count, available)
  values
    (p_sailing_id, p_cabin_type, p_date, p_price, p_price, p_price, 1, p_available)
  on conflict (sailing_id, cabin_type, date) do update set
    min_price    = least(price_history_daily.min_price, excluded.min_price),
    max_price    = greatest(price_history_daily.max_price, excluded.max_price),
    avg_price    = (
                    price_history_daily.avg_price * price_history_daily.sample_count
                    + excluded.avg_price
                  ) / (price_history_daily.sample_count + 1),
    sample_count = price_history_daily.sample_count + 1,
    available    = excluded.available;
end $$;

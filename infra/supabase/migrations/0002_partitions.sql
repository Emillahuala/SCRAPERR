-- 0002_partitions.sql
-- Particionamos price_history por mes para:
-- 1. Permitir borrar mes viejo con drop table (instantáneo, sin VACUUM).
-- 2. Que queries con filtro temporal escaneen sólo particiones relevantes.
-- price_history_daily agrega datos > 6 meses (1 fila por sailing/cabin/día).

create table if not exists price_history (
  sailing_id   bigint not null references sailings(id) on delete cascade,
  cabin_type   text not null,
  price_usd    numeric(10,2) not null check (price_usd > 0),
  price_clp    numeric(12,0),
  available    boolean default true,
  captured_at  timestamptz not null default now()
) partition by range (captured_at);

-- Crea (si no existe) la partición que contiene el mes objetivo.
create or replace function ensure_price_history_partition(target_month date)
returns void language plpgsql as $$
declare
  start_date date := date_trunc('month', target_month)::date;
  end_date date := (start_date + interval '1 month')::date;
  partition_name text := 'price_history_' || to_char(start_date, 'YYYY_MM');
begin
  execute format(
    'create table if not exists %I partition of price_history
     for values from (%L) to (%L)',
    partition_name, start_date, end_date
  );
  execute format(
    'create index if not exists %I on %I (sailing_id, cabin_type, captured_at desc)',
    partition_name || '_idx', partition_name
  );
end $$;

-- Trigger que asegura partición existente antes de cada INSERT.
create or replace function trigger_ensure_partition()
returns trigger language plpgsql as $$
begin
  perform ensure_price_history_partition(new.captured_at::date);
  return new;
end $$;

-- Particiones del mes actual y siguiente (al desplegar).
select ensure_price_history_partition(current_date);
select ensure_price_history_partition(current_date + interval '1 month');

-- Tabla agregada (1 fila/sailing/cabin/día) para datos > 6 meses.
create table if not exists price_history_daily (
  sailing_id   bigint references sailings(id) on delete cascade,
  cabin_type   text not null,
  date         date not null,
  min_price    numeric(10,2),
  max_price    numeric(10,2),
  avg_price    numeric(10,2),
  sample_count int,
  primary key (sailing_id, cabin_type, date)
);
create index if not exists idx_price_history_daily_date
  on price_history_daily(date);

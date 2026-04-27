# Esquema de base de datos

Todo el SQL vive en `infra/supabase/migrations/` numerado secuencialmente.
Cada migración es **idempotente** (`create table if not exists`, etc).

## Migración 0001: schema base

```sql
-- 0001_init.sql

-- Compañías navieras
create table if not exists cruise_lines (
  id          serial primary key,
  name        text not null unique,
  rating      numeric(2,1),
  source_url  text
);

-- Barcos
create table if not exists ships (
  id             serial primary key,
  cruise_line_id int references cruise_lines(id) on delete cascade,
  name           text not null,
  unique(cruise_line_id, name)
);

-- Itinerario = identidad del producto
create table if not exists itineraries (
  id              serial primary key,
  ship_id         int references ships(id) on delete cascade,
  name            text not null,
  duration_nights int not null check (duration_nights > 0),
  departure_port  text not null,
  region          text not null,
  ports_of_call   text[],
  hash_key        text not null unique,
  created_at      timestamptz default now()
);
create index if not exists idx_itineraries_region on itineraries(region);
create index if not exists idx_itineraries_duration on itineraries(duration_nights);

-- Sailing = zarpe específico
create table if not exists sailings (
  id             bigserial primary key,
  itinerary_id   int references itineraries(id) on delete cascade,
  departure_date date not null,
  source_url     text not null,
  source_id      text,
  active         boolean default true,
  created_at     timestamptz default now(),
  unique(itinerary_id, departure_date)
);
create index if not exists idx_sailings_active_date
  on sailings(departure_date) where active = true;

-- Perfiles de usuario (extiende auth.users)
create table if not exists profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  display_name     text,
  telegram_chat_id text,
  preferences      jsonb default '{}'::jsonb,
  created_at       timestamptz default now()
);

-- Alertas
create table if not exists alerts (
  id             uuid default gen_random_uuid() primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  region         text,
  cruise_line_id int references cruise_lines(id),
  sailing_id     bigint references sailings(id) on delete cascade,
  cabin_type     text,
  max_price_usd  numeric(10,2),
  min_z_score    numeric(3,2) default -1.5,
  channel        text default 'email' check (channel in ('email','telegram','push')),
  active         boolean default true,
  created_at     timestamptz default now(),
  -- Al menos un filtro debe estar definido
  check (region is not null or cruise_line_id is not null or sailing_id is not null)
);
create index if not exists idx_alerts_active_user on alerts(user_id) where active = true;
```

## Migración 0002: particionamiento

```sql
-- 0002_partitions.sql

-- Tabla particionada por mes para escalar
create table if not exists price_history (
  sailing_id   bigint not null references sailings(id) on delete cascade,
  cabin_type   text not null,
  price_usd    numeric(10,2) not null check (price_usd > 0),
  price_clp    numeric(12,0),
  available    boolean default true,
  captured_at  timestamptz not null default now()
) partition by range (captured_at);

-- Función para crear particiones automáticamente
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

-- Trigger que asegura partición existente antes de cada INSERT
create or replace function trigger_ensure_partition()
returns trigger language plpgsql as $$
begin
  perform ensure_price_history_partition(new.captured_at::date);
  return new;
end $$;

-- Crear particiones del mes actual y siguiente al desplegar
select ensure_price_history_partition(current_date);
select ensure_price_history_partition(current_date + interval '1 month');

-- Tabla agregada para datos > 6 meses (1 fila por sailing/cabin/día)
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
```

## Migración 0003: vista materializada y deal score

```sql
-- 0003_materialized_view.sql

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
  -- Deal score 0-100 (más alto = mejor oferta)
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

create unique index if not exists idx_current_deals_unique
  on current_deals (sailing_id, cabin_type);
create index if not exists idx_current_deals_score
  on current_deals (deal_score desc);
create index if not exists idx_current_deals_region
  on current_deals (region, deal_score desc);
```

## Migración 0004: RLS (Row Level Security)

```sql
-- 0004_rls_policies.sql

-- Datos públicos: cualquiera puede leer
alter table cruise_lines enable row level security;
alter table ships enable row level security;
alter table itineraries enable row level security;
alter table sailings enable row level security;

create policy "public read cruise_lines"
  on cruise_lines for select using (true);
create policy "public read ships"
  on ships for select using (true);
create policy "public read itineraries"
  on itineraries for select using (true);
create policy "public read sailings"
  on sailings for select using (true);

-- price_history: público leer, solo service role escribir
alter table price_history enable row level security;
create policy "public read price_history"
  on price_history for select using (true);

-- Profiles: usuario solo ve y edita el suyo
alter table profiles enable row level security;
create policy "users see own profile"
  on profiles for select using (auth.uid() = id);
create policy "users update own profile"
  on profiles for update using (auth.uid() = id);
create policy "users insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- Alerts: usuario solo ve y modifica las suyas
alter table alerts enable row level security;
create policy "users full access own alerts"
  on alerts for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

## Migración 0005: pg_cron jobs

```sql
-- 0005_cron_jobs.sql

-- Refrescar vista materializada cada hora
select cron.schedule(
  'refresh-current-deals',
  '0 * * * *',
  $$ refresh materialized view concurrently current_deals $$
);

-- Crear partición del próximo mes el día 25 de cada mes
select cron.schedule(
  'create-next-partition',
  '0 0 25 * *',
  $$ select ensure_price_history_partition(current_date + interval '1 month') $$
);

-- Agregación nocturna: mover datos > 6 meses a price_history_daily
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
```

## Convenciones

- Todas las tablas en **snake_case**.
- IDs `serial` para tablas pequeñas (cruise_lines, ships, itineraries).
- IDs `bigserial` para tablas que crecen rápido (sailings).
- Timestamps siempre con timezone (`timestamptz`).
- Constraints explícitos (`check`, `unique`, foreign keys con `on delete cascade`).
- Índices nombrados explícitamente con prefijo `idx_<tabla>_<columnas>`.
- Migraciones idempotentes (`if not exists` siempre que se pueda).

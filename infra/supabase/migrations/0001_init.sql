-- 0001_init.sql
-- Schema base: identidad de productos (cruise_lines, ships, itineraries, sailings)
-- + tablas de usuario (profiles, alerts).

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

-- Itinerario = identidad del producto (ruta + barco + duración).
-- hash_key permite deduplicar el mismo itinerario aunque cambie el orden de campos.
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

-- Sailing = zarpe específico (itinerario + fecha).
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

-- Perfiles de usuario (extiende auth.users con datos de aplicación).
create table if not exists profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  display_name     text,
  telegram_chat_id text,
  preferences      jsonb default '{}'::jsonb,
  created_at       timestamptz default now()
);

-- Alertas configuradas por el usuario.
-- Al menos un filtro debe estar definido (region, cruise_line o sailing específico).
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
  check (region is not null or cruise_line_id is not null or sailing_id is not null)
);
create index if not exists idx_alerts_active_user on alerts(user_id) where active = true;

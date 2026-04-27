-- 0004_rls_policies.sql
-- RLS: datos de catálogo y precios son públicos para lectura.
-- Datos de usuario (profiles, alerts) sólo accesibles por su dueño.
-- La escritura en tablas públicas se hace con service_role (sin pasar por RLS).

-- Catálogo público
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

-- price_history: lectura pública, escritura sólo via service_role
alter table price_history enable row level security;
create policy "public read price_history"
  on price_history for select using (true);

-- profiles: cada usuario sólo ve y edita el suyo
alter table profiles enable row level security;
create policy "users see own profile"
  on profiles for select using (auth.uid() = id);
create policy "users update own profile"
  on profiles for update using (auth.uid() = id);
create policy "users insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- alerts: cada usuario sólo ve y modifica las suyas
alter table alerts enable row level security;
create policy "users full access own alerts"
  on alerts for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

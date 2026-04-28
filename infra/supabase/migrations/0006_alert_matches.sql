-- 0006_alert_matches.sql
-- Records each (alert × deal) match. Inserted by the refresh-deals Edge
-- Function; flipped to notified=true by dispatch-notifications.

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
create index if not exists idx_alert_matches_user_created
  on alert_matches(user_id, created_at desc);
create index if not exists idx_alert_matches_alert
  on alert_matches(alert_id);

alter table alert_matches enable row level security;

-- Users can read their own matches (Realtime channel filters use this).
create policy "users see own matches"
  on alert_matches for select using (auth.uid() = user_id);

-- RPC used by the refresh-deals Edge Function. security definer = runs with
-- the function owner's privileges, so service_role doesn't need MV ownership.
create or replace function refresh_current_deals()
returns void language plpgsql security definer as $$
begin
  refresh materialized view concurrently current_deals;
end $$;

grant execute on function refresh_current_deals() to service_role;

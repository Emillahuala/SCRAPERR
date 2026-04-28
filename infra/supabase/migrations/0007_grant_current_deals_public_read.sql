-- current_deals es una vista materializada — necesita GRANT explícito
-- porque no hereda el RLS de las tablas subyacentes.
GRANT SELECT ON public.current_deals TO anon, authenticated;

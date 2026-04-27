# Setup local y despliegue

## Prerequisitos

Instala antes de empezar:

| Herramienta | Versión | Instalación |
|-------------|---------|-------------|
| Python | 3.12+ | https://www.python.org/downloads/ |
| uv | latest | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| Node.js | 20+ | https://nodejs.org/ |
| pnpm | 9+ | `npm install -g pnpm` |
| Supabase CLI | latest | https://supabase.com/docs/guides/local-development/cli/getting-started |
| Deno | 1.45+ | (opcional, para Edge Functions) |
| Git | 2.40+ | https://git-scm.com/ |

## Setup paso a paso

### 1. Clonar y configurar variables

```bash
git clone <repo-url> offerhunter
cd offerhunter
cp .env.example .env
```

Edita `.env` con tus credenciales (las obtienes en los pasos siguientes).

### 2. Crear proyecto en Supabase

1. Ve a https://supabase.com y crea un proyecto nuevo (free tier).
2. Anota:
   - Project URL → `SUPABASE_URL` y `VITE_SUPABASE_URL`
   - Anon key → `VITE_SUPABASE_ANON_KEY`
   - Service role key → `SUPABASE_SERVICE_ROLE_KEY` (¡secreto!)
3. En el dashboard, **Database → Extensions**, habilita:
   - `pg_cron` (para jobs programados)

### 3. Aplicar migraciones

```bash
cd infra/supabase
supabase login
supabase link --project-ref <tu-project-ref>
supabase db push
```

Verifica en el SQL Editor del dashboard que las tablas existen:
```sql
select table_name from information_schema.tables
where table_schema = 'public'
order by table_name;
```

### 4. Generar tipos TypeScript

```bash
supabase gen types typescript --project-id <tu-project-id> \
  > frontend/src/types/database.ts
```

Commitea este archivo. Lo regeneras cuando cambies el schema.

### 5. Setup del scraper

```bash
cd services/scraper
uv sync
uv run pytest                    # los tests deben pasar
uv run python -m scraper.cli run --site cruceros_cl --dry-run --max-items 5
```

Si todo va bien, deberías ver 5 sailings impresos en consola.

### 6. Setup del frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Abre http://localhost:5173. Deberías ver la página de login.

### 7. Configurar Edge Functions

```bash
# Setear secrets
supabase secrets set RESEND_API_KEY=re_xxx
supabase secrets set FROM_EMAIL=alerts@tudominio.com
supabase secrets set FRONTEND_URL=http://localhost:5173

# Desplegar
supabase functions deploy refresh-deals
supabase functions deploy dispatch-notifications

# Verificar
curl -X POST \
  https://<tu-project>.supabase.co/functions/v1/refresh-deals \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>"
```

### 8. Configurar Resend

1. Crea cuenta en https://resend.com (free: 3000 emails/mes).
2. Verifica un dominio o usa `onboarding@resend.dev` para empezar.
3. Genera API key → `RESEND_API_KEY`.

---

## Despliegue a producción

### Frontend → Vercel

```bash
# Desde el dashboard de Vercel:
# 1. Import Git Repository
# 2. Root Directory: frontend
# 3. Framework: Vite
# 4. Variables de entorno:
#    VITE_SUPABASE_URL=...
#    VITE_SUPABASE_ANON_KEY=...
# 5. Deploy
```

Tras deploy, actualiza el secret en Supabase:
```bash
supabase secrets set FRONTEND_URL=https://offerhunter.vercel.app
```

### GitHub Actions (scraper)

1. En tu repo, **Settings → Secrets and variables → Actions**:
   ```
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
2. El workflow `.github/workflows/scrape-cruceros.yml` se activa automáticamente
   con el cron `0 */6 * * *`.
3. Para disparar manualmente: **Actions → scrape-cruceros → Run workflow**.

### Configurar redirect URLs en Supabase Auth

En el dashboard de Supabase: **Authentication → URL Configuration**:
- **Site URL**: `https://offerhunter.vercel.app`
- **Redirect URLs**: añade `https://offerhunter.vercel.app/**`

Sin esto, el magic link redirige a localhost en producción.

---

## Smoke test post-deploy

Lista de verificaciones:

- [ ] Visitar URL pública carga sin errores.
- [ ] Login con magic link recibe email y redirige correctamente.
- [ ] Lista de deals se carga (puede estar vacía si aún no scrapeó).
- [ ] Disparar manualmente el GitHub Action y esperar a que termine.
- [ ] Refrescar dashboard: aparecen deals.
- [ ] Click en deal abre detalle con chart histórico.
- [ ] Crear alerta funciona (aparece en Mis Alertas).
- [ ] Forzar `refresh-deals`: si hay match, llega email.

---

## Troubleshooting común

### "supabase: command not found"
Instala el CLI: https://supabase.com/docs/guides/local-development/cli/getting-started

### El scraper no encuentra cards
Inspecciona cruceros.cl en el navegador, copia el HTML actual y actualiza fixtures
y selectores. Los sitios cambian su markup periódicamente.

### Edge Function devuelve 401
Verifica que estás usando `SUPABASE_SERVICE_ROLE_KEY`, no el anon key.

### Magic link redirige a localhost en producción
Configura **Site URL** y **Redirect URLs** en Supabase Auth.

### `pnpm build` falla con errores de TypeScript
Verifica que `frontend/src/types/database.ts` está actualizado:
```bash
supabase gen types typescript --project-id <id> > frontend/src/types/database.ts
```

### GitHub Action falla por timeout
El job tiene `timeout-minutes: 30`. Si scraping toma más, reduce regiones o
páginas en `.env`.

### Postgres llega al límite de 500MB
Verifica el job de agregación nocturna corre:
```sql
select * from cron.job;
select * from cron.job_run_details order by start_time desc limit 10;
```
Si está OK, considera migrar a Supabase Pro ($25/mes, 8GB).

---

## Monitoreo

### Logs del scraper
- En GitHub Actions: cada run tiene logs completos.
- Logs estructurados en JSON; filtra con `jq` si descargas el artifact.

### Logs de Edge Functions
- Dashboard de Supabase: **Edge Functions → [función] → Logs**.

### Métricas de Supabase
- Dashboard: **Reports** muestra uso de DB, storage, bandwidth.
- Cuando uses > 80% de cualquier límite, considera migración.

### Errores frontend
Para producción seria, considera **Sentry** (free tier 5k events/mes).
No incluido en MVP.

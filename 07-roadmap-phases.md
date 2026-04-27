# Roadmap de implementación por fases

Cada fase es **autocontenida** y debe terminar con código funcionando, testeado
y mergeable. **No saltes adelante**. Termina una fase antes de empezar la siguiente.

---

## Fase 0 — Bootstrap del repo (1-2 horas)

**Objetivo**: estructura base lista, sin código de producto todavía.

**Tareas**:
1. Crear estructura de carpetas según `06-folder-structure.md`.
2. Inicializar `git`, crear `.gitignore`, `.env.example`, `README.md`.
3. Crear `services/scraper/pyproject.toml` con dependencias mínimas.
4. Inicializar `frontend/` con `pnpm create vite@latest -- --template react-ts`.
5. Configurar Tailwind + shadcn/ui en frontend.
6. Crear `infra/supabase/` con `supabase init`.
7. Configurar workflows básicos de CI (lint + tests vacíos pasan).

**Definition of done**:
- `cd services/scraper && uv sync && uv run pytest` ejecuta (0 tests, todos pasan).
- `cd frontend && pnpm install && pnpm build` produce dist/ exitoso.
- `pnpm dev` levanta el servidor en localhost:5173.
- CI verde en PR de prueba.

**Prompt sugerido para Claude Code**:
> Lee `CLAUDE.md` y `PROJECT.md`. Ejecuta la Fase 0 según `07-roadmap-phases.md`.
> Antes de crear nada, muéstrame el plan de archivos y comandos que vas a ejecutar.

---

## Fase 1 — Esquema de base de datos (1-2 horas)

**Objetivo**: Supabase tiene todas las tablas, particiones, RLS y vistas creadas.

**Tareas**:
1. Crear proyecto en Supabase (manual, fuera de Claude Code).
2. Configurar `infra/supabase/config.toml` y vincular proyecto.
3. Crear migraciones `0001` a `0005` exactamente según `02-database-schema.md`.
   La migración `0006_alert_matches.sql` se crea en **Fase 4** junto con las Edge Functions (ver `05-edge-functions-spec.md`).
4. Aplicar migraciones contra el proyecto Supabase: `supabase db push`.
5. Verificar manualmente en el SQL Editor que todo existe y RLS está activo.
6. Generar tipos TypeScript: `supabase gen types typescript > frontend/src/types/database.ts`.

**Definition of done**:
- Las 6 migraciones aplican sin error.
- `select * from current_deals` devuelve 0 filas pero no falla.
- RLS activo en `alerts`, `profiles`, `alert_matches`.
- Tipos TypeScript generados y commiteados.

---

## Fase 2 — Scraper para cruceros.cl (4-6 horas)

**Objetivo**: scraper completo, testeado, capaz de poblar Supabase.

**Tareas**:
1. Implementar `core/http_client.py` con rotación de UAs y retry.
2. Implementar `core/logger.py` con structlog en JSON.
3. Implementar `domain/normalizer.py` con sus tests unitarios primero.
4. **Inspeccionar cruceros.cl manualmente** y descargar 2-3 fixtures HTML
   reales en `tests/fixtures/`.
5. Implementar `spiders/cruceros_cl.py` con selectores reales.
6. Implementar `pipelines/supabase_pipeline.py` con cache.
7. Implementar `cli.py` con typer.
8. Tests:
   - `test_normalizer.py` (formatos de precio, fecha, cabina).
   - `test_cruceros_cl_parser.py` con fixtures reales.
   - `test_supabase_pipeline.py` con mocks.

**Definition of done**:
- `uv run python -m scraper.cli run --site cruceros_cl --dry-run --max-items 10`
  imprime 10 sailings parseados correctamente.
- Sin `--dry-run`, los datos aparecen en Supabase.
- Coverage de tests > 80% en `domain/` y `core/`.
- `ruff check` y `mypy` sin errores.

**Nota crítica**: si no se puede acceder a cruceros.cl o los selectores no son
inferibles del HTML, **detener** y pedir al humano que provea HTML de muestra.

---

## Fase 3 — GitHub Actions cron (1 hora)

**Objetivo**: scraper corriendo automáticamente cada 6h.

**Tareas**:
1. Crear `.github/workflows/scrape-cruceros.yml` con cron `0 */6 * * *`.
2. Configurar secrets en GitHub: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
3. Workflow ejecuta: setup Python 3.12 → uv sync → ejecuta scraper.
4. Subir artifacts de logs en caso de fallo.
5. Disparar manualmente con `workflow_dispatch` para verificar.

**Definition of done**:
- Run manual desde GitHub Actions termina exitoso.
- Datos nuevos aparecen en `price_history` después del run.
- Tiempo de ejecución < 25 minutos (con margen de los 30 max).

---

## Fase 4 — Edge Functions (2-3 horas)

**Objetivo**: alertas funcionando end-to-end.

**Tareas**:
1. Implementar `refresh-deals/index.ts`.
2. Implementar `dispatch-notifications/index.ts` con Resend.
3. Configurar dominio en Resend (puede ser `onboarding@resend.dev` para empezar).
4. Setear secrets: `RESEND_API_KEY`, `FROM_EMAIL`, `FRONTEND_URL`.
5. Desplegar: `supabase functions deploy refresh-deals` y `dispatch-notifications`.
6. Crear test manual: insertar registro fake en `alerts`, simular detección,
   verificar email recibido.
7. Añadir paso en GitHub Actions que invoca `refresh-deals` post-scraping.

**Definition of done**:
- Función `refresh-deals` invocable y devuelve JSON con stats.
- Email de prueba llega correctamente con HTML formateado.
- `alert_matches` se puebla cuando hay match real.

---

## Fase 5 — Frontend MVP (4-6 horas)

**Objetivo**: dashboard básico con auth, listado de deals y detalle.

**Tareas**:
1. Configurar `lib/supabase.ts` con cliente tipado.
2. Implementar `app/providers.tsx` (QueryClient, Theme).
3. Implementar `app/routes.tsx` con React Router.
4. Implementar `LoginPage` con magic link.
5. Implementar `DealsList` + `DealCard` + filtros básicos.
6. Implementar `SailingDetail` con `PriceChart` (Recharts). Sin `PredictionBand` (post-MVP).
7. Implementar `useDeals`, `useSailing`, `useAuth`.
8. Estilos con shadcn/ui (no inventar componentes nuevos).

**Definition of done**:
- Login con magic link funciona.
- Lista de deals carga desde Supabase y filtra correctamente.
- Click en deal abre detalle con chart histórico de precios.
- Responsive en mobile.
- `pnpm build` produce bundle sin errores ni warnings de TS.

---

## Fase 6 — Sistema de alertas (3-4 horas)

**Objetivo**: usuario puede crear, ver y gestionar alertas.

**Tareas**:
1. Implementar `AlertsList` y `AlertForm` (modal con shadcn/ui).
2. Implementar `useAlerts` (CRUD vía Supabase RLS).
3. Implementar `useAlertNotifications` con Realtime channel.
4. Toast en la UI cuando llega match nuevo.
5. Botón "Crear alerta" en `SailingDetail`.

**Definition of done**:
- Usuario crea alerta desde UI.
- Recibe email cuando hay match.
- Recibe toast en tiempo real si está conectado.
- Puede pausar/eliminar alertas.

---

## Fase 7 — Insights y polish (3-4 horas)

**Objetivo**: vista de insights con KPIs y heatmap.

**Tareas**:
1. Implementar `KpiCards` (4-6 métricas clave).
2. Implementar `SeasonalityHeatmap` (mes × región).
3. Implementar `TrendChart` últimos 90 días por región.
4. Pulir UX: loading states, empty states, errores manejados.
5. Modo oscuro funcionando.
6. Optimización de queries (limit, indexes verificados).

**Definition of done**:
- Insights carga en < 2s.
- Heatmap legible con escala de color clara.
- Sin errores en consola en navegación normal.

---

## Fase 8 — Despliegue (1-2 horas)

**Objetivo**: todo en producción y verificado.

**Tareas**:
1. Deploy frontend en Vercel (conectar repo).
2. Configurar variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` en Vercel.
3. Configurar `FRONTEND_URL` en Supabase secrets.
4. Verificar magic link redirige correctamente.
5. Smoke test end-to-end:
   - Registrarse.
   - Ver deals.
   - Crear alerta.
   - Esperar siguiente run de scraping.
   - Verificar match y email.

**Definition of done**:
- App accesible en URL pública.
- Smoke test completo exitoso.
- README actualizado con URL de demo.

---

## Fases futuras (post-MVP)

- **Fase 9**: agregar más sitios (Costa Cruceros directo, MSC directo, NCL).
- **Fase 10**: predicciones con Prophet en GitHub Action nocturno.
- **Fase 11**: matching inter-sitio (mismo crucero en distintos agregadores).
- **Fase 12**: notificaciones push (PWA) y Telegram.
- **Fase 13**: monetización (afiliados, premium tier).

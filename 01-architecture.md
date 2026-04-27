# Arquitectura

## Diagrama lógico

```
┌─────────────────────────────────────────────────────────────┐
│  GitHub Actions (cron cada 6h, gratis 2000min/mes)          │
│    └─► Python scraper (services/scraper)                    │
│         ├─ httpx + selectolax (parse HTML)                  │
│         ├─ Rotación de User-Agents                          │
│         ├─ Normalización + matching                         │
│         └─ Upsert vía supabase-py                           │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase (free tier)                                       │
│    ├─ Postgres 500MB                                        │
│    │   ├─ cruise_lines, ships, itineraries, sailings       │
│    │   ├─ price_history (particionada por mes)             │
│    │   ├─ price_history_daily (agregada > 6 meses)         │
│    │   ├─ alerts, profiles                                 │
│    │   └─ current_deals (vista materializada)              │
│    ├─ Auth (magic link)                                     │
│    ├─ Storage 1GB (HTML crudo gzipped, TTL 7 días)         │
│    ├─ Edge Functions (Deno/TS):                             │
│    │   ├─ refresh-deals (refresh MV + detectar nuevas)     │
│    │   └─ dispatch-notifications (Resend)                  │
│    └─ pg_cron: refresh hourly, agregación nocturna          │
└──────────────────────┬──────────────────────────────────────┘
                       ▼ (Realtime + REST)
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Vercel free)                                     │
│    React 18 + TypeScript + Vite                             │
│    Tailwind + shadcn/ui + TanStack Query + Recharts         │
│    Supabase JS client (auth + realtime)                     │
└─────────────────────────────────────────────────────────────┘
```

## Decisiones técnicas y justificación

### ¿Por qué Supabase free tier?
- Postgres real (no pseudo-DB), Auth, Storage, Edge Functions, todo en uno.
- 500MB alcanzan para ~6-9 meses de scraping si agregamos datos viejos.
- Migración a Pro ($25/mes, 8GB) es trivial cuando crezcamos.

### ¿Por qué GitHub Actions en vez de Celery/RabbitMQ?
- Gratis hasta 2000 min/mes en repos privados.
- Para 1 sitio cada 6h son ~120 ejecuciones/mes (muy bajo el límite).
- Sin servidor 24/7, sin queue, sin complejidad operacional.
- **Cuándo migrar**: cuando agreguemos 5+ sitios o necesitemos mayor frecuencia.

### ¿Por qué httpx + selectolax y no Playwright?
- Cruceros.cl renderiza HTML server-side (no SPA).
- httpx + selectolax es ~10x más rápido y barato en CPU.
- **Solo usar Playwright** si detectamos contenido cargado por JS.

### ¿Por qué particionamiento manual y no TimescaleDB?
- TimescaleDB no está disponible en Supabase free tier.
- Particionar por mes en Postgres puro da 90% del beneficio:
  - Queries con filtro temporal solo escanean particiones relevantes.
  - Borrar mes viejo = `drop table` (instantáneo, sin VACUUM).
- Después de 6 meses agregamos a `price_history_daily` (1 fila/día/cabina).

### ¿Por qué Edge Functions y no servicio Python para alertas?
- Se ejecutan al lado de Postgres (latencia ~5ms vs ~100ms).
- Deno + TypeScript = código tipado y rápido.
- 500k invocaciones/mes gratis sobra para alertas event-driven.
- Análisis pesado (Prophet, ML) seguirá siendo Python en GitHub Actions nocturno.

## Flujo de datos completo

### 1. Captura (cada 6h vía cron)
```
GitHub Action dispara → scraper.cli run --site cruceros_cl
  → httpx GET /d-26-caribe?page=1
  → selectolax parsea cards de itinerarios
  → para cada itinerario, GET detalle
  → extrae sailings (fecha + cabina + precio)
  → publica al pipeline Supabase
```

### 2. Persistencia
```
SupabasePipeline:
  → upsert cruise_line (cache local)
  → upsert ship (cache local)
  → upsert itinerary con hash determinístico
  → upsert sailing (itinerary_id, departure_date)
  → INSERT en price_history (append-only)
  → opcional: subir HTML gzipped a Storage
```

### 3. Análisis (cada hora vía pg_cron)
```
REFRESH MATERIALIZED VIEW current_deals
  → recalcula z_score, min_180d, avg_180d para cada (sailing, cabin)
  → marca is_180d_low cuando aplica
```

### 4. Alertas (event-driven)
```
Edge Function refresh-deals (invocada post-scraping):
  → detecta nuevos is_180d_low en últimas 6h
  → cruza con tabla alerts (filtros del usuario)
  → invoca dispatch-notifications:
       → email vía Resend con chart embedded
       → push vía Supabase Realtime al frontend
```

### 5. Visualización
```
Usuario abre dashboard:
  → Auth con magic link (Supabase Auth)
  → fetch deals con TanStack Query
  → renderiza DealCard + filtros dinámicos
  → click en deal → SailingDetail con PriceChart histórico + PredictionBand
```

## Estimación de capacidad

| Métrica | Valor estimado |
|---------|----------------|
| Sailings activos | ~3.000 |
| Tipos de cabina por sailing | 4 |
| Capturas por día | 4 |
| Filas nuevas por mes | ~1.4M |
| Tamaño por fila | ~80 bytes |
| Crecimiento mensual | ~110 MB |
| Capacidad libre (500MB) | ~4 meses sin agregación, ~12 meses con agregación |

## Cuándo migrar fuera del free tier

| Trigger | Solución |
|---------|----------|
| Postgres > 500MB | Supabase Pro $25/mes (8GB) |
| Más de 5 sitios scrapeando | VPS Hetzner $5/mes con Celery |
| Necesitas Playwright a escala | VPS dedicado, Actions ya no rinde |
| Latencia de alertas crítica | Servicio Python siempre encendido |
| Tráfico al frontend > 100GB/mes | Cloudflare Pages o autohost |

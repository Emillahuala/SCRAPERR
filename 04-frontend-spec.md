# Especificación del frontend

## Stack
- **React 18** + **TypeScript** (strict mode)
- **Vite** como bundler
- **Tailwind CSS** + **shadcn/ui** para UI
- **TanStack Query** para fetching y cache
- **Recharts** para gráficos
- **React Router** para navegación
- **Supabase JS Client** para auth + datos + realtime
- **Zustand** para estado UI local (filtros, modales)

## Vistas principales

### 1. Home / Radar de Ofertas (`/`)
**Objetivo**: que en 5 segundos el usuario vea las mejores ofertas del momento.

**Componentes**:
- Header con búsqueda + filtros rápidos (región, duración, naviera).
- Grid de `DealCard` ordenadas por `deal_score` desc.
- Cada card muestra:
  - Badge con score 0-100 (color verde/amarillo/rojo).
  - Naviera + barco + región.
  - Fecha de zarpe + duración en noches.
  - Precio actual vs promedio histórico (con flecha indicadora).
  - Indicador "🎯 Mínimo en 6 meses" si `is_180d_low`.

**Filtros dinámicos** (sidebar o top bar):
- Región (multi-select).
- Rango de precio.
- Tipo de cabina.
- Duración (noches).
- Solo mostrar mínimos históricos (toggle).
- Score mínimo (slider).

### 2. Detalle de Sailing (`/sailing/:id`)
**Objetivo**: que el usuario decida con datos si comprar o esperar.

**Componentes**:
- Header con ruta, naviera, fecha, duración, puertos de escala.
- `PriceChart`: línea histórica de los últimos 12 meses, una serie por cabina.
  - Banda sombreada con min/max.
  - Línea vertical en hoy.
- ~~`PredictionBand`~~: **omitido del MVP** (post-MVP, Fase 10). El chart histórico termina en hoy; sin extensión futura.
- `KpiRow`:
  - Precio actual (con delta vs promedio).
  - Z-score con interpretación textual ("Excelente oferta", "Precio normal").
  - Días al zarpe.
  - Mejor mes histórico para comprar (de la tabla de estacionalidad).
- Botón "Crear alerta para este sailing".
- Botón "Ver en cruceros.cl" → abre `source_url`.

### 3. Mis Alertas (`/alerts`)
**Objetivo**: gestionar watchlist.

**Componentes**:
- Lista de alertas activas con preview del último match.
- `AlertForm` modal para crear/editar:
  - Tipo de filtro: por sailing específico, por región, por naviera.
  - Cabina, precio máximo, score mínimo.
  - Canal: email / push.
- Botones para pausar/reanudar/eliminar.
- Sección de "Alertas disparadas recientemente" con fecha y precio del match.

### 4. Insights (`/insights`)
**Objetivo**: mostrar inteligencia agregada del mercado.

**Componentes**:
- `SeasonalityHeatmap`: matriz mes × región con precio promedio. Permite
  identificar visualmente cuándo conviene comprar cada destino.
- `TopDealsThisWeek`: top 10 ofertas de la última semana.
- `KpiCards`: # ofertas activas, precio promedio, ahorro promedio detectado.
- `TrendChart`: evolución del precio promedio por región últimos 90 días.

### 5. Auth (`/login`)
- Magic link con Supabase Auth (sin password).
- Redirige a `/` tras login.

## Estructura de carpetas frontend

```
frontend/
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── app/
│   │   ├── routes.tsx                  # React Router config
│   │   ├── providers.tsx               # QueryClient, Auth, Theme
│   │   └── layout.tsx                  # Layout principal con nav
│   ├── features/
│   │   ├── deals/
│   │   │   ├── DealsList.tsx
│   │   │   ├── DealCard.tsx
│   │   │   ├── DealsFilters.tsx
│   │   │   ├── useDeals.ts             # hook con TanStack Query
│   │   │   └── types.ts
│   │   ├── sailing-detail/
│   │   │   ├── SailingDetail.tsx
│   │   │   ├── PriceChart.tsx
│   │   │   ├── KpiRow.tsx
│   │   │   └── useSailing.ts
│   │   ├── alerts/
│   │   │   ├── AlertsList.tsx
│   │   │   ├── AlertForm.tsx
│   │   │   ├── useAlerts.ts
│   │   │   └── useAlertNotifications.ts # subscribe a Realtime
│   │   ├── insights/
│   │   │   ├── InsightsPage.tsx
│   │   │   ├── SeasonalityHeatmap.tsx
│   │   │   ├── KpiCards.tsx
│   │   │   └── TrendChart.tsx
│   │   └── auth/
│   │       ├── LoginPage.tsx
│   │       └── useAuth.ts
│   ├── components/
│   │   └── ui/                         # shadcn/ui components
│   ├── lib/
│   │   ├── supabase.ts                 # cliente único
│   │   ├── format.ts                   # formatters (money, dates)
│   │   └── query-client.ts
│   ├── hooks/
│   │   └── useDebounce.ts
│   ├── store/
│   │   └── filtersStore.ts             # Zustand
│   └── types/
│       └── database.ts                 # tipos generados de Supabase
└── tests/
    └── ...
```

## Patrones obligatorios

### Tipos de Supabase
Generar tipos desde Supabase y commitearlos:
```bash
supabase gen types typescript --project-id <id> > src/types/database.ts
```
Importar siempre así:
```typescript
import type { Database } from '@/types/database'
type Deal = Database['public']['Views']['current_deals']['Row']
```

### Cliente Supabase
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

### Hooks con TanStack Query
```typescript
// src/features/deals/useDeals.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Deal = Database['public']['Views']['current_deals']['Row']

interface DealsFilters {
  region?: string
  minScore?: number
  maxPrice?: number
  cabinType?: string
}

export function useDeals(filters: DealsFilters) {
  return useQuery({
    queryKey: ['deals', filters],
    queryFn: async (): Promise<Deal[]> => {
      let query = supabase
        .from('current_deals')
        .select('*')
        .order('deal_score', { ascending: false })
        .limit(50)

      if (filters.region) query = query.eq('region', filters.region)
      if (filters.minScore) query = query.gte('deal_score', filters.minScore)
      if (filters.maxPrice) query = query.lte('current_price', filters.maxPrice)
      if (filters.cabinType) query = query.eq('cabin_type', filters.cabinType)

      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
    staleTime: 60_000, // 1 minuto
  })
}
```

### Realtime para alertas
```typescript
// src/features/alerts/useAlertNotifications.ts
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function useAlertNotifications(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel('alert-matches')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alert_matches',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          toast.success('Nueva oferta detectada', {
            description: payload.new.message,
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])
}
```

## Diseño visual

### Principios
- **Limpio**, **alta densidad de información** sin abrumar.
- Mobile-first responsivo.
- Modo oscuro disponible (Tailwind `dark:`).
- Accesible (componentes shadcn/ui ya lo son).

### Paleta sugerida (Tailwind)
- Primario: `slate-900` / `slate-50` (texto/fondo según modo).
- Acento: `cyan-500` (relacionado a mar/océano para tema cruceros).
- Score alto: `emerald-500`. Medio: `amber-500`. Bajo: `slate-400`.
- Mínimos históricos: `rose-500` con badge destacado.

### Componentes shadcn/ui requeridos
```bash
npx shadcn@latest add button card badge dialog form input \
  select slider switch toast skeleton table tabs
```

## Tests
- **Vitest** + **Testing Library**.
- Tests de componentes críticos: `DealCard`, `AlertForm`, `PriceChart`.
- Mock de Supabase con MSW o stub directo.
- No tests E2E en MVP (Playwright más adelante si se justifica).

# Estándares de código y convenciones

## Filosofía
**Clean Code, no clever code.** Preferir lo legible sobre lo conciso. Una función
que un junior entiende sin preguntar vale más que un one-liner ingenioso.

## Python (services/scraper)

### Tooling
- **Versión**: Python 3.12+
- **Formatter**: ruff format (reemplaza black)
- **Linter**: ruff check
- **Type checker**: mypy strict
- **Test runner**: pytest + pytest-cov
- **Package manager**: uv

### Reglas duras
1. **Type hints obligatorios** en toda firma pública.
2. **No `Any`** salvo en bordes externos (libs sin types).
3. **No abreviaturas** crípticas: `cruise_line` no `cl`, `response` no `resp`.
4. **Funciones < 30 líneas**. Si crece más, refactor.
5. **Clases** solo cuando hay estado o dependencias inyectables. Para puro
   transformar datos, función pura.
6. **Dataclasses** (frozen) para DTOs, no `dict`.
7. **No `print`** en código de producción, siempre `logger`.

### Estructura de un módulo
```python
"""Scraper for cruceros.cl using static HTML parsing.

Pure parsing logic lives in `domain/`; this module orchestrates HTTP and yields
domain objects.
"""
from __future__ import annotations

from collections.abc import Iterator
from typing import Final

import structlog

from scraper.core.http_client import HttpClient
from scraper.domain.models import CruiseSailing

logger = structlog.get_logger(__name__)

BASE_URL: Final = "https://www.cruceros.cl"


class CrucerosClScraper:
    """Spider for cruceros.cl.

    Iterates regions defined in config, paginates, parses detail pages.
    """

    def __init__(self, http_client: HttpClient, regions: dict[str, str]) -> None:
        self._http = http_client
        self._regions = regions

    def scrape(self) -> Iterator[CruiseSailing]:
        for region_name, region_path in self._regions.items():
            yield from self._scrape_region(region_name, region_path)
```

### Manejo de errores
```python
# MAL: silenciar
try:
    do_something()
except Exception:
    pass

# MAL: log sin contexto
try:
    do_something()
except Exception as e:
    logger.error(str(e))

# BIEN: contexto + decisión clara
try:
    sailing = parse_sailing(card)
except ValueError as exc:
    logger.warning("sailing_parse_failed",
                   url=card_url, field="price", error=str(exc))
    continue  # decisión explícita: skip este item, continuar el batch
except Exception as exc:
    logger.exception("sailing_parse_unexpected_error", url=card_url)
    raise  # re-raise lo no esperado
```

### Tests
```python
# tests/test_normalizer.py
import pytest
from scraper.domain.normalizer import parse_price

class TestParsePrice:
    @pytest.mark.parametrize("text, expected", [
        ("US$1.080", 1080.0),
        ("USD 1,080.00", 1080.0),
        ("desde US$1.080", 1080.0),
        ("$ 572", 572.0),
    ])
    def test_valid_formats(self, text: str, expected: float) -> None:
        assert parse_price(text) == expected

    @pytest.mark.parametrize("text", ["", "consultar", "agotado", None])
    def test_invalid_returns_none(self, text: str | None) -> None:
        assert parse_price(text) is None
```

### Naming
- `snake_case` para variables y funciones.
- `PascalCase` para clases.
- `SCREAMING_SNAKE_CASE` para constantes.
- Prefijo `_` para privados de módulo/clase.
- Sin `get_` para getters simples; `fetch_` o `load_` para I/O.

---

## TypeScript (frontend)

### Tooling
- **TypeScript 5.5+** con `strict: true`.
- **ESLint** con preset de React + TypeScript.
- **Prettier** (vía ESLint plugin).
- **Vitest** + **Testing Library**.
- **Package manager**: pnpm.

### Reglas duras
1. **`strict` en `tsconfig.json`**. No relajar.
2. **No `any`**. Si necesitas escape hatch, usa `unknown` y narrow.
3. **Prefiere unions sobre enums**: `type Status = 'idle' | 'loading'` mejor
   que `enum Status`.
4. **Interfaces solo para objetos**, types para todo lo demás.
5. **Componentes funcionales** con hooks, nunca clases.
6. **Props tipadas con `interface`** que termina en `Props`.
7. **No default exports** salvo páginas top-level (mejor para refactoring).

### Estructura de un componente
```typescript
// src/features/deals/DealCard.tsx
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { formatMoney, formatDate } from '@/lib/format'
import type { Database } from '@/types/database'

type Deal = Database['public']['Views']['current_deals']['Row']

interface DealCardProps {
  deal: Deal
  onClick?: (sailingId: number) => void
}

export function DealCard({ deal, onClick }: DealCardProps) {
  const scoreColor = getScoreColor(deal.deal_score ?? 0)

  return (
    <Card
      className="cursor-pointer transition hover:shadow-md"
      onClick={() => onClick?.(deal.sailing_id!)}
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h3 className="font-semibold">{deal.cruise_line}</h3>
          <p className="text-sm text-slate-500">{deal.itinerary}</p>
        </div>
        <Badge className={scoreColor}>{deal.deal_score}</Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold">
            {formatMoney(deal.current_price ?? 0)}
          </span>
          {deal.is_180d_low && (
            <Badge variant="destructive">🎯 Mín. 6 meses</Badge>
          )}
        </div>
        <p className="text-sm text-slate-500">
          Zarpa {formatDate(deal.departure_date!)}
        </p>
      </CardContent>
    </Card>
  )
}

function getScoreColor(score: number): string {
  if (score >= 75) return 'bg-emerald-500'
  if (score >= 50) return 'bg-amber-500'
  return 'bg-slate-400'
}
```

### Imports ordenados
```typescript
// 1. React / Node builtins
import { useState } from 'react'

// 2. External libs
import { useQuery } from '@tanstack/react-query'

// 3. Aliases internos (@/...)
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

// 4. Relativos
import { DealCard } from './DealCard'
import type { DealsFilters } from './types'
```

### Hooks
- Empezar con `use`.
- Uno por archivo cuando es complejo.
- Tipos de retorno explícitos en hooks complejos:
```typescript
export function useDeals(filters: DealsFilters): UseQueryResult<Deal[]> {
  // ...
}
```

---

## SQL

### Convenciones
- **snake_case** para tablas, columnas, índices, funciones.
- **Plurales** para tablas (`sailings`, no `sailing`).
- **Nombres descriptivos** de índices: `idx_<tabla>_<columnas>`.
- **Migraciones idempotentes** cuando sea posible (`if not exists`).
- **Comentarios en SQL** explicando el "porqué" no el "qué".

### Ejemplo
```sql
-- 0002_partitions.sql
-- Particionamos price_history por mes para:
-- 1. Permitir borrar mes viejo con drop table (instantáneo).
-- 2. Que queries con filtro temporal escaneen menos datos.

create table if not exists price_history (
  sailing_id   bigint not null references sailings(id) on delete cascade,
  cabin_type   text not null,
  price_usd    numeric(10,2) not null check (price_usd > 0),
  captured_at  timestamptz not null default now()
) partition by range (captured_at);
```

---

## Git

### Mensajes de commit (Conventional Commits)
```
feat(scraper): add cruceros.cl spider with pagination
fix(frontend): correct deal score color thresholds
docs(architecture): clarify partitioning rationale
test(normalizer): add edge cases for parse_date_es
chore(deps): bump supabase-py to 2.6
refactor(pipeline): extract caching into separate class
```

### Branches
- `main`: producción.
- `feat/<scope>-<description>`: features.
- `fix/<scope>-<description>`: bugs.
- Sin push directo a `main`. Siempre PR.

### PRs
- Título usa Conventional Commit format.
- Descripción incluye: qué cambia, por qué, cómo testear.
- CI debe pasar antes de merge.

---

## Documentación inline

### Cuándo escribir docstring
- **Toda función pública** de un módulo importable.
- Clases con responsabilidad compleja.
- Funciones con > 5 líneas de lógica no obvia.

### Cuándo NO escribir comentarios
- Para explicar **qué** hace el código (eso lo dice el código).
- Para repetir el nombre de la función en prosa.

### Cuándo SÍ escribir comentarios
- Para explicar **por qué** se hace algo de cierta manera.
- Para advertir sobre asumptions o gotchas.
- Para linkear a issue/spec/RFC.

```python
# MAL
# Iterar sobre las regiones
for region in regions:
    ...

# BIEN
# Procesamos regiones secuencialmente para no saturar el sitio.
# Paralelizar requeriría rate limiting global, ver issue #42.
for region in regions:
    ...
```

# Instrucciones permanentes para Claude Code — OfferHunter

Este archivo se carga automáticamente en cada sesión. Mantén el contexto en los archivos `.md` de la raíz del repo.

## Sobre el proyecto
Sistema de scraping inteligente para detectar ofertas reales en cruceros.cl, usando
Supabase free tier, GitHub Actions y React. Lee `PROJECT.md` para visión general
y los archivos en la raíz del repo para detalles técnicos.

## Cómo trabajar conmigo

### Antes de codear
1. **Lee la documentación relevante** (archivos `.md` en la raíz) antes de empezar cualquier tarea.
2. **Muestra un plan** antes de escribir código. Espera mi confirmación.
3. **Pregunta si dudas** sobre selectores, endpoints o esquemas. No inventes.

### Durante el trabajo
- Avanza **fase por fase** según `07-roadmap-phases.md`. No saltes adelante.
- **Tests primero** en lógica de negocio: parsing, normalización, deal score.
- **Commits atómicos** con formato `feat(scope): ...` o `fix(scope): ...`.
- **No instales** dependencias fuera del stack sin preguntar.
- **No toques** `.env`, secretos, ni hagas push a `main` sin que te lo pida.

### Estándares
- Sigue `08-coding-standards.md` al pie de la letra.
- Python: type hints siempre, mypy strict, ruff + black.
- TypeScript: strict mode, sin `any`, prefiere unions sobre enums.
- SQL: snake_case, migraciones numeradas en `infra/supabase/migrations/`.

### Manejo de errores
- Logs estructurados en JSON (`event`, `level`, `context`).
- Reintentos exponenciales en network calls (3 intentos, base 2s).
- Nunca silencies excepciones; loguea con contexto.

### Cuando necesites contexto adicional
- Esquema de DB: `02-database-schema.md`
- Cómo es cruceros.cl: `03-scraper-spec.md`
- Componentes UI esperados: `04-frontend-spec.md`
- Setup local: `09-deployment.md`

## Comandos útiles del proyecto

```bash
# Backend scraper
cd services/scraper
uv sync                              # instala deps
uv run pytest                        # tests
uv run ruff check . && uv run mypy . # lint
uv run python -m scraper.cli run --site cruceros_cl --dry-run

# Frontend
cd frontend
pnpm install
pnpm dev
pnpm test
pnpm build

# Supabase local (opcional)
supabase start
supabase db reset
supabase functions serve refresh-deals
```

## Stack obligatorio (no cambies sin acuerdo)
- **Scraper**: Python 3.12, httpx, selectolax, supabase-py, pydantic, structlog
- **Frontend**: React 18, TypeScript, Vite, Tailwind, shadcn/ui, TanStack Query, Recharts
- **DB**: Supabase (Postgres, Auth, Storage, Edge Functions Deno/TS)
- **CI/Cron**: GitHub Actions
- **Notificaciones**: Resend (email), opcional Telegram Bot API
- **Package managers**: uv (Python), pnpm (frontend)

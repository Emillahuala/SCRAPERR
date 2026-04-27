# Estructura completa del repositorio

```
offerhunter/                           # carpeta raíz (SCRAPERR/)
├── CLAUDE.md                          # Instrucciones permanentes (Claude Code)
├── PROJECT.md                         # Visión general
├── README.md                          # Para humanos
├── .gitignore
├── .env.example                       # Plantilla de variables
├── 01-architecture.md                 # Documentación técnica (en raíz)
├── 02-database-schema.md
├── 03-scraper-spec.md
├── 04-frontend-spec.md
├── 05-edge-functions-spec.md
├── 06-folder-structure.md
├── 07-roadmap-phases.md
├── 08-coding-standards.md
├── 09-deployment.md
│
├── services/
│   └── scraper/                       # Backend Python
│       ├── pyproject.toml             # uv + dependencies
│       ├── ruff.toml
│       ├── mypy.ini
│       ├── README.md
│       ├── src/
│       │   └── scraper/
│       │       ├── __init__.py
│       │       ├── cli.py             # entrypoint typer
│       │       ├── config.py          # pydantic-settings
│       │       ├── core/
│       │       │   ├── __init__.py
│       │       │   ├── base_scraper.py
│       │       │   ├── http_client.py
│       │       │   └── logger.py      # structlog config
│       │       ├── domain/
│       │       │   ├── __init__.py
│       │       │   ├── models.py      # CruiseSailing dataclass
│       │       │   └── normalizer.py  # parse_price, parse_date_es, etc.
│       │       ├── spiders/
│       │       │   ├── __init__.py
│       │       │   └── cruceros_cl.py
│       │       └── pipelines/
│       │           ├── __init__.py
│       │           └── supabase_pipeline.py
│       └── tests/
│           ├── __init__.py
│           ├── conftest.py
│           ├── test_normalizer.py
│           ├── test_cruceros_cl_parser.py
│           ├── test_supabase_pipeline.py
│           └── fixtures/
│               ├── cruceros_cl_listing.html
│               └── cruceros_cl_detail.html
│
├── frontend/                          # Dashboard React
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── postcss.config.js
│   ├── components.json                # shadcn/ui config
│   ├── index.html
│   ├── .eslintrc.cjs
│   ├── README.md
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css                  # Tailwind base
│   │   ├── app/
│   │   │   ├── routes.tsx
│   │   │   ├── providers.tsx
│   │   │   └── layout.tsx
│   │   ├── features/
│   │   │   ├── deals/
│   │   │   │   ├── DealsList.tsx
│   │   │   │   ├── DealCard.tsx
│   │   │   │   ├── DealsFilters.tsx
│   │   │   │   ├── useDeals.ts
│   │   │   │   └── types.ts
│   │   │   ├── sailing-detail/
│   │   │   │   ├── SailingDetail.tsx
│   │   │   │   ├── PriceChart.tsx
│   │   │   │   ├── PredictionBand.tsx
│   │   │   │   ├── KpiRow.tsx
│   │   │   │   └── useSailing.ts
│   │   │   ├── alerts/
│   │   │   │   ├── AlertsList.tsx
│   │   │   │   ├── AlertForm.tsx
│   │   │   │   ├── useAlerts.ts
│   │   │   │   └── useAlertNotifications.ts
│   │   │   ├── insights/
│   │   │   │   ├── InsightsPage.tsx
│   │   │   │   ├── SeasonalityHeatmap.tsx
│   │   │   │   ├── KpiCards.tsx
│   │   │   │   └── TrendChart.tsx
│   │   │   └── auth/
│   │   │       ├── LoginPage.tsx
│   │   │       └── useAuth.ts
│   │   ├── components/
│   │   │   └── ui/                    # shadcn/ui components
│   │   ├── lib/
│   │   │   ├── supabase.ts
│   │   │   ├── format.ts
│   │   │   └── query-client.ts
│   │   ├── hooks/
│   │   │   └── useDebounce.ts
│   │   ├── store/
│   │   │   └── filtersStore.ts        # Zustand
│   │   └── types/
│   │       └── database.ts            # generado de Supabase
│   └── tests/
│       ├── setup.ts
│       └── ...
│
├── infra/
│   └── supabase/
│       ├── config.toml                # supabase CLI config
│       ├── seed.sql                   # datos iniciales (opcional)
│       ├── migrations/
│       │   ├── 0001_init.sql
│       │   ├── 0002_partitions.sql
│       │   ├── 0003_materialized_view.sql
│       │   ├── 0004_rls_policies.sql
│       │   ├── 0005_cron_jobs.sql
│       │   └── 0006_alert_matches.sql
│       └── functions/
│           ├── refresh-deals/
│           │   ├── index.ts
│           │   └── deno.json
│           └── dispatch-notifications/
│               ├── index.ts
│               └── deno.json
│
└── .github/
    └── workflows/
        ├── scrape-cruceros.yml        # cron cada 6h
        ├── ci-scraper.yml             # lint + tests Python en PR
        ├── ci-frontend.yml            # lint + tests + build en PR
        └── deploy-functions.yml       # deploy de Edge Functions
```

## Archivos clave de configuración

### `.env.example`
```bash
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Scraper
SCRAPER_LOG_LEVEL=INFO
SCRAPER_REGIONS=caribe,mediterraneo,sudamerica,fiordos,chile
SCRAPER_MIN_DELAY_SECONDS=2.0
SCRAPER_MAX_DELAY_SECONDS=5.0

# Frontend (prefijo VITE_ para exponer al cliente)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Edge Functions
RESEND_API_KEY=re_...
FROM_EMAIL=alerts@tudominio.com
FRONTEND_URL=https://offerhunter.vercel.app
```

### `.gitignore`
```
# Python
__pycache__/
*.pyc
.venv/
.pytest_cache/
.mypy_cache/
.ruff_cache/
htmlcov/
.coverage

# Node
node_modules/
dist/
.next/
.vite/
*.log

# Env
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Supabase
infra/supabase/.branches/
infra/supabase/.temp/
```

### `services/scraper/pyproject.toml`
```toml
[project]
name = "offerhunter-scraper"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "httpx>=0.27",
    "selectolax>=0.3.21",
    "supabase>=2.6",
    "pydantic>=2.7",
    "pydantic-settings>=2.3",
    "structlog>=24.1",
    "typer>=0.12",
]

[project.optional-dependencies]
dev = [
    "pytest>=8",
    "pytest-cov>=5",
    "ruff>=0.5",
    "mypy>=1.10",
    "respx>=0.21",  # mock httpx
]

[tool.ruff]
line-length = 100
target-version = "py312"

[tool.ruff.lint]
select = ["E", "F", "I", "N", "W", "B", "UP", "RUF"]

[tool.mypy]
python_version = "3.12"
strict = true

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-v --cov=scraper --cov-report=term-missing"
```

### `frontend/package.json` (extracto)
```json
{
  "name": "offerhunter-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx",
    "test": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "@tanstack/react-query": "^5.50.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.24.0",
    "recharts": "^2.12.0",
    "zustand": "^4.5.0",
    "sonner": "^1.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.5.0",
    "vite": "^5.3.0",
    "vitest": "^2.0.0",
    "eslint": "^9.0.0"
  }
}
```

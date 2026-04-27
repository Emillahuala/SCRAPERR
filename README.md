# OfferHunter 🚢

Cazador inteligente de ofertas de cruceros que detecta **descuentos reales** (no
rebajas teatrales) usando análisis estadístico de precios históricos.

## Quick start

```bash
# Clonar y configurar
git clone <repo-url> offerhunter
cd offerhunter
cp .env.example .env
# Edita .env con tus credenciales de Supabase

# Backend scraper
cd services/scraper
uv sync
uv run python -m scraper.cli run --site cruceros_cl --dry-run

# Frontend
cd frontend
pnpm install
pnpm dev
```

Ver `09-deployment.md` para setup completo.

## Arquitectura

```
GitHub Actions (cron) → Python scraper → Supabase Postgres
                                            ↓
                                       Edge Functions (alertas)
                                            ↓
                          React Dashboard (Vercel) + Email (Resend)
```

Ver `01-architecture.md` para detalles.

## Estado del proyecto

Ver `07-roadmap-phases.md` para fases de implementación.

## Licencia

MIT

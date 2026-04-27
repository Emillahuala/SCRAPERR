"""Application settings loaded from environment / .env file."""
from __future__ import annotations

from typing import Final

from pydantic_settings import BaseSettings, SettingsConfigDict
from supabase import Client, create_client

# Catalogue of region paths on cruceros.cl. SCRAPER_REGIONS picks a subset by name.
# IDs verified 2026-04-27 against the live homepage (the spec's IDs were stale).
REGION_PATHS: Final[dict[str, str]] = {
    "caribe":         "/d-7541-caribe",
    "mediterraneo":   "/d-35-mediterraneo",
    "sudamerica":     "/d-113-sudamerica",
    "fiordos":        "/d-41-fiordos-escandinavia",
    "bahamas":        "/d-17-bahamas",
    "antillas":       "/d-23-antillas",
    "tahiti":         "/d-137-tahiti",
    "islas_griegas":  "/d-71-islas-griegas",
    "transatlantico": "/d-401-transatlantico",
    "artico":         "/d-371-artico",
    "vuelta_mundo":   "/d-341-vuelta-al-mundo",
}


class Settings(BaseSettings):
    """Reads from environment first, then ``.env`` at the repo root."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # Supabase (only required when running without --dry-run).
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    # Scraper
    scraper_log_level: str = "INFO"
    scraper_regions: str = "caribe,mediterraneo,sudamerica,fiordos"
    scraper_min_delay_seconds: float = 2.0
    scraper_max_delay_seconds: float = 5.0

    @property
    def regions(self) -> dict[str, str]:
        """Return the {name: path} subset enabled via SCRAPER_REGIONS."""
        names = [r.strip().lower() for r in self.scraper_regions.split(",") if r.strip()]
        return {name: REGION_PATHS[name] for name in names if name in REGION_PATHS}

    def supabase_client(self) -> Client:
        """Build a Supabase client. Errors clearly if credentials are missing."""
        if not self.supabase_url or not self.supabase_service_role_key:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set "
                "(use --dry-run to skip persistence during development)"
            )
        return create_client(self.supabase_url, self.supabase_service_role_key)

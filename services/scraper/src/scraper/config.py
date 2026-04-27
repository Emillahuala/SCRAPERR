"""Application settings loaded from environment / .env file."""
from __future__ import annotations

from typing import Final

from pydantic_settings import BaseSettings, SettingsConfigDict
from supabase import Client, create_client

# Catalogue of region paths on cruceros.cl. SCRAPER_REGIONS picks a subset by name.
REGION_PATHS: Final[dict[str, str]] = {
    "caribe":       "/d-26-caribe",
    "mediterraneo": "/d-25-mediterraneo",
    "sudamerica":   "/d-113-sudamerica",
    "fiordos":      "/d-30-fiordos",
    "chile":        "/d-540-chile",
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
    scraper_regions: str = "caribe,mediterraneo,sudamerica,fiordos,chile"
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

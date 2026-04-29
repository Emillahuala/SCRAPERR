"""Command-line entrypoint. Run with ``uv run python -m scraper.cli ...``."""
from __future__ import annotations

import sys
from typing import Annotated

import structlog
import typer

from scraper.config import Settings
from scraper.core.base_scraper import BaseScraper
from scraper.core.http_client import HttpClient
from scraper.core.logger import configure_logging
from scraper.pipelines.supabase_pipeline import SupabasePipeline
from scraper.spiders.cruceros_cl import CrucerosClFullSpider, CrucerosClHomeSpider

app = typer.Typer(no_args_is_help=True, add_completion=False)


def _build_scraper(site: str, settings: Settings, http: HttpClient) -> BaseScraper:
    """Resolve a spider class by site name. Spiders register here as they land."""
    if site == "cruceros_cl_home":
        return CrucerosClHomeSpider(http)
    if site == "cruceros_cl":
        return CrucerosClFullSpider(http, regions=settings.regions)
    raise typer.BadParameter(f"Unknown site '{site}'")


@app.command()
def run(
    site: Annotated[str, typer.Option(help="Site to scrape (e.g. cruceros_cl)")],
    dry_run: Annotated[
        bool, typer.Option(help="Parse but do not persist to Supabase")
    ] = False,
    max_items: Annotated[
        int | None, typer.Option(help="Stop after N sailings (testing)")
    ] = None,
) -> None:
    """Run a scraper end-to-end."""
    settings = Settings()
    configure_logging(settings.scraper_log_level)
    log = structlog.get_logger("cli")

    log.info("scrape_started", site=site, dry_run=dry_run, max_items=max_items)

    with HttpClient(
        min_delay=settings.scraper_min_delay_seconds,
        max_delay=settings.scraper_max_delay_seconds,
    ) as http:
        scraper = _build_scraper(site, settings, http)
        pipeline = None if dry_run else SupabasePipeline(settings.supabase_client())

        count = 0
        for sailing in scraper.scrape():
            if max_items is not None and count >= max_items:
                break
            if pipeline is not None:
                pipeline.process(sailing)
            else:
                typer.echo(repr(sailing))
            count += 1

        if pipeline is not None:
            try:
                pipeline.refresh_deals()
            except Exception as exc:
                log.warning("materialized_view_refresh_failed", error=str(exc))

    log.info("scrape_finished", site=site, processed=count)


if __name__ == "__main__":
    try:
        app()
    except typer.BadParameter as exc:
        typer.echo(f"error: {exc}", err=True)
        sys.exit(2)

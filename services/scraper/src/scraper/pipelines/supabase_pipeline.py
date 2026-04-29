"""Persists CruiseSailing instances into Supabase Postgres.

Caches (cruise_line, ship, itinerary, sailing) IDs in-memory per run so we
upsert each entity at most once even when many sailings share it.
"""
from __future__ import annotations

from datetime import date
from typing import Any, Protocol

import structlog

from scraper.domain.models import CruiseSailing
from scraper.domain.normalizer import itinerary_hash

logger = structlog.get_logger(__name__)


class SupabaseLike(Protocol):
    """Minimal subset of the Supabase client we depend on (eases testing)."""

    def table(self, name: str) -> Any: ...
    def rpc(self, fn: str) -> Any: ...


class SupabasePipeline:
    """Insert pipeline. Idempotent at the entity level via on_conflict upserts."""

    def __init__(self, supabase: SupabaseLike) -> None:
        self._db = supabase
        self._cruise_line_cache: dict[str, int] = {}
        self._ship_cache: dict[tuple[int, str], int] = {}
        self._itinerary_cache: dict[str, int] = {}
        self._sailing_cache: dict[tuple[int, date], int] = {}

    def process(self, sailing: CruiseSailing) -> None:
        cruise_line_id = self._upsert_cruise_line(sailing.cruise_line)
        ship_id = self._upsert_ship(cruise_line_id, sailing.ship)
        itinerary_id = self._upsert_itinerary(ship_id, sailing)
        sailing_id = self._upsert_sailing(itinerary_id, sailing)
        self._insert_price(sailing_id, sailing)

    def _upsert_cruise_line(self, name: str) -> int:
        if name in self._cruise_line_cache:
            return self._cruise_line_cache[name]
        result = (
            self._db.table("cruise_lines")
            .upsert({"name": name}, on_conflict="name")
            .execute()
        )
        cruise_line_id = int(result.data[0]["id"])
        self._cruise_line_cache[name] = cruise_line_id
        return cruise_line_id

    def _upsert_ship(self, cruise_line_id: int, name: str) -> int:
        key = (cruise_line_id, name)
        if key in self._ship_cache:
            return self._ship_cache[key]
        result = (
            self._db.table("ships")
            .upsert(
                {"cruise_line_id": cruise_line_id, "name": name},
                on_conflict="cruise_line_id,name",
            )
            .execute()
        )
        ship_id = int(result.data[0]["id"])
        self._ship_cache[key] = ship_id
        return ship_id

    def _upsert_itinerary(self, ship_id: int, s: CruiseSailing) -> int:
        hash_key = itinerary_hash(
            ship_id, s.itinerary_name, s.duration_nights, s.departure_port
        )
        if hash_key in self._itinerary_cache:
            return self._itinerary_cache[hash_key]
        result = (
            self._db.table("itineraries")
            .upsert(
                {
                    "ship_id": ship_id,
                    "name": s.itinerary_name,
                    "duration_nights": s.duration_nights,
                    "departure_port": s.departure_port,
                    "region": s.region,
                    "ports_of_call": list(s.ports_of_call),
                    "hash_key": hash_key,
                },
                on_conflict="hash_key",
            )
            .execute()
        )
        itinerary_id = int(result.data[0]["id"])
        self._itinerary_cache[hash_key] = itinerary_id
        return itinerary_id

    def _upsert_sailing(self, itinerary_id: int, s: CruiseSailing) -> int:
        key = (itinerary_id, s.departure_date)
        if key in self._sailing_cache:
            return self._sailing_cache[key]
        result = (
            self._db.table("sailings")
            .upsert(
                {
                    "itinerary_id": itinerary_id,
                    "departure_date": s.departure_date.isoformat(),
                    "source_url": s.source_url,
                    "active": True,
                },
                on_conflict="itinerary_id,departure_date",
            )
            .execute()
        )
        sailing_id = int(result.data[0]["id"])
        self._sailing_cache[key] = sailing_id
        return sailing_id

    def _insert_price(self, sailing_id: int, s: CruiseSailing) -> None:
        self._db.table("price_history").insert(
            {
                "sailing_id": sailing_id,
                "cabin_type": s.cabin_type,
                "price_usd": s.price_usd,
                "available": True,
            }
        ).execute()

    def refresh_deals(self) -> None:
        """Refresh the current_deals materialized view after a scrape run."""
        self._db.rpc("refresh_current_deals").execute()
        logger.info("materialized_view_refreshed")

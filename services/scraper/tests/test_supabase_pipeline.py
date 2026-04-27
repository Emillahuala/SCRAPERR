"""Tests for SupabasePipeline using a fake client. Verifies caching + payloads."""
from __future__ import annotations

from datetime import date
from typing import Any

import pytest

from scraper.domain.models import CruiseSailing
from scraper.pipelines.supabase_pipeline import SupabasePipeline


class FakeQuery:
    """Records every chained call against a Supabase table builder."""

    def __init__(self, fake_id: int, log: list[dict[str, Any]], table: str) -> None:
        self._fake_id = fake_id
        self._log = log
        self._table = table
        self._op: str | None = None
        self._payload: dict[str, Any] | None = None
        self._on_conflict: str | None = None

    def upsert(self, payload: dict[str, Any], on_conflict: str | None = None) -> FakeQuery:
        self._op = "upsert"
        self._payload = payload
        self._on_conflict = on_conflict
        return self

    def insert(self, payload: dict[str, Any]) -> FakeQuery:
        self._op = "insert"
        self._payload = payload
        return self

    def execute(self) -> Any:
        self._log.append(
            {
                "table": self._table,
                "op": self._op,
                "payload": self._payload,
                "on_conflict": self._on_conflict,
            }
        )

        class _Result:
            def __init__(self, fake_id: int) -> None:
                self.data = [{"id": fake_id}]

        return _Result(self._fake_id)


class FakeSupabase:
    """In-memory stand-in: assigns sequential fake IDs per table."""

    def __init__(self) -> None:
        self.calls: list[dict[str, Any]] = []
        self._counters: dict[str, int] = {}

    def table(self, name: str) -> FakeQuery:
        self._counters[name] = self._counters.get(name, 0) + 1
        return FakeQuery(fake_id=self._counters[name], log=self.calls, table=name)


@pytest.fixture
def sailing() -> CruiseSailing:
    return CruiseSailing(
        cruise_line="MSC Cruceros",
        ship="MSC Seaview",
        itinerary_name="Caribe Occidental 7 noches",
        duration_nights=7,
        departure_port="Miami",
        departure_date=date(2027, 2, 22),
        region="caribe",
        ports_of_call=("Cozumel", "Roatán"),
        cabin_type="balcon",
        price_usd=1080.0,
        source_url="https://www.cruceros.cl/detalle/123",
    )


def _table_calls(calls: list[dict[str, Any]], table: str) -> list[dict[str, Any]]:
    return [c for c in calls if c["table"] == table]


def test_process_inserts_into_all_tables(sailing: CruiseSailing) -> None:
    fake = FakeSupabase()
    pipeline = SupabasePipeline(fake)

    pipeline.process(sailing)

    tables_touched = [c["table"] for c in fake.calls]
    assert tables_touched == [
        "cruise_lines",
        "ships",
        "itineraries",
        "sailings",
        "price_history",
    ]


def test_cache_avoids_duplicate_upserts_for_same_sailing(sailing: CruiseSailing) -> None:
    fake = FakeSupabase()
    pipeline = SupabasePipeline(fake)

    pipeline.process(sailing)
    pipeline.process(sailing)

    # Catalogue tables upserted once each. price_history inserted twice.
    assert len(_table_calls(fake.calls, "cruise_lines")) == 1
    assert len(_table_calls(fake.calls, "ships")) == 1
    assert len(_table_calls(fake.calls, "itineraries")) == 1
    assert len(_table_calls(fake.calls, "sailings")) == 1
    assert len(_table_calls(fake.calls, "price_history")) == 2


def test_different_cabin_same_sailing_reuses_caches(sailing: CruiseSailing) -> None:
    fake = FakeSupabase()
    pipeline = SupabasePipeline(fake)

    pipeline.process(sailing)
    pipeline.process(
        CruiseSailing(**{**sailing.__dict__, "cabin_type": "interior", "price_usd": 720.0})
    )

    # Same itinerary + sailing, only price_history grows.
    assert len(_table_calls(fake.calls, "cruise_lines")) == 1
    assert len(_table_calls(fake.calls, "itineraries")) == 1
    assert len(_table_calls(fake.calls, "sailings")) == 1
    assert len(_table_calls(fake.calls, "price_history")) == 2


def test_itinerary_payload_uses_hash_key_and_list_ports(sailing: CruiseSailing) -> None:
    fake = FakeSupabase()
    pipeline = SupabasePipeline(fake)

    pipeline.process(sailing)

    itinerary_call = _table_calls(fake.calls, "itineraries")[0]
    payload = itinerary_call["payload"]
    assert payload["region"] == "caribe"
    assert payload["duration_nights"] == 7
    assert payload["departure_port"] == "Miami"
    # ports_of_call is a tuple in the model but must be a list for postgres.
    assert payload["ports_of_call"] == ["Cozumel", "Roatán"]
    assert isinstance(payload["hash_key"], str) and len(payload["hash_key"]) == 32
    assert itinerary_call["on_conflict"] == "hash_key"


def test_price_history_payload(sailing: CruiseSailing) -> None:
    fake = FakeSupabase()
    pipeline = SupabasePipeline(fake)

    pipeline.process(sailing)

    price_call = _table_calls(fake.calls, "price_history")[0]
    assert price_call["op"] == "insert"
    assert price_call["payload"]["cabin_type"] == "balcon"
    assert price_call["payload"]["price_usd"] == 1080.0
    assert price_call["payload"]["available"] is True


def test_sailing_payload_uses_iso_date(sailing: CruiseSailing) -> None:
    fake = FakeSupabase()
    pipeline = SupabasePipeline(fake)

    pipeline.process(sailing)

    sailing_call = _table_calls(fake.calls, "sailings")[0]
    assert sailing_call["payload"]["departure_date"] == "2027-02-22"

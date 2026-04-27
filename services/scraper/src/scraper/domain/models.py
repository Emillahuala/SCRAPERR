"""Domain models — pure data containers, no I/O."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True)
class CruiseSailing:
    """A specific sailing date with a price for one cabin type.

    This is the atomic unit yielded by spiders and consumed by the pipeline.
    Frozen so instances are hashable and safe to share across threads.
    """

    cruise_line: str
    ship: str
    itinerary_name: str
    duration_nights: int
    departure_port: str
    departure_date: date
    region: str
    ports_of_call: tuple[str, ...]
    cabin_type: str
    price_usd: float
    source_url: str

"""Pure parsing/normalization helpers — no I/O, fully unit-testable."""
from __future__ import annotations

import hashlib
import re
from datetime import date, datetime

_MONTHS_ES: dict[str, int] = {
    "enero": 1, "febrero": 2, "marzo": 3, "abril": 4,
    "mayo": 5, "junio": 6, "julio": 7, "agosto": 8,
    "septiembre": 9, "octubre": 10, "noviembre": 11, "diciembre": 12,
}

_NUMBER_RE = re.compile(r"\d[\d.,]*")
_DATE_ES_RE = re.compile(
    r"(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})", re.IGNORECASE
)


def parse_price(text: str | None) -> float | None:
    """Extract a price from a free-text string.

    Handles both Spanish and English number formats by detecting the decimal
    separator from position (the right-most ``.`` or ``,`` is treated as the
    decimal separator when both are present).
    """
    if not text or not text.strip():
        return None

    match = _NUMBER_RE.search(text)
    if not match:
        return None

    raw = match.group(0)
    last_dot = raw.rfind(".")
    last_comma = raw.rfind(",")

    if last_dot == -1 and last_comma == -1:
        return float(raw)

    if last_dot != -1 and last_comma != -1:
        # Both present: the later one is the decimal separator.
        if last_dot > last_comma:
            cleaned = raw.replace(",", "")
        else:
            cleaned = raw.replace(".", "").replace(",", ".")
        return _safe_float(cleaned)

    # Only one separator: 3 digits after → thousand separator, else decimal.
    sep = "." if last_dot != -1 else ","
    sep_pos = last_dot if last_dot != -1 else last_comma
    digits_after = len(raw) - sep_pos - 1

    if digits_after == 3:
        cleaned = raw.replace(sep, "")
    else:
        cleaned = raw.replace(",", ".") if sep == "," else raw

    return _safe_float(cleaned)


def parse_date_es(text: str | None) -> date | None:
    """Parse Spanish-language and numeric date formats."""
    if not text:
        return None

    cleaned = text.strip().lower()
    if not cleaned:
        return None

    es_match = _DATE_ES_RE.match(cleaned)
    if es_match:
        day_s, month_name, year_s = es_match.groups()
        month = _MONTHS_ES.get(month_name)
        if month is not None:
            try:
                return date(int(year_s), month, int(day_s))
            except ValueError:
                return None

    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
        try:
            return datetime.strptime(cleaned, fmt).date()
        except ValueError:
            continue

    return None


def normalize_cabin_type(text: str) -> str:
    """Map free-text cabin descriptions to canonical categories."""
    lowered = text.lower().strip()
    if "suite" in lowered:
        return "suite"
    if "balc" in lowered or "balcony" in lowered:
        return "balcon"
    if "vista" in lowered or "ocean view" in lowered or "exterior" in lowered:
        return "vista"
    return "interior"


def itinerary_hash(ship_id: int, name: str, duration: int, port: str) -> str:
    """Deterministic 32-char identifier for an itinerary.

    Used as the natural key in the ``itineraries`` table to dedupe across runs.
    Case- and whitespace-invariant.
    """
    raw = f"{ship_id}|{name.strip().lower()}|{duration}|{port.strip().lower()}"
    return hashlib.sha256(raw.encode()).hexdigest()[:32]


def _safe_float(text: str) -> float | None:
    try:
        return float(text)
    except ValueError:
        return None

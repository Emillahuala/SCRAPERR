"""Tests for the normalizer (TDD — written before implementation)."""
from __future__ import annotations

from datetime import date

import pytest

from scraper.domain.normalizer import (
    itinerary_hash,
    normalize_cabin_type,
    parse_date_es,
    parse_price,
)


class TestParsePrice:
    @pytest.mark.parametrize(
        "text, expected",
        [
            # Spanish formats (cruceros.cl uses these)
            ("US$1.080", 1080.0),
            ("desde US$1.080", 1080.0),
            ("US$ 1.080", 1080.0),
            ("$1.080", 1080.0),
            ("US$1.080,50", 1080.50),
            ("US$2.345.678", 2345678.0),
            # English formats (just in case)
            ("USD 1,080.00", 1080.0),
            ("$1,080.50", 1080.50),
            # No thousand separator
            ("$ 572", 572.0),
            ("USD 99", 99.0),
            ("99.50", 99.50),
            ("99,50", 99.50),
            # Surrounding noise
            ("Precio: USD 1.499 por persona", 1499.0),
        ],
    )
    def test_valid_formats(self, text: str, expected: float) -> None:
        result = parse_price(text)
        assert result == pytest.approx(expected)

    @pytest.mark.parametrize(
        "text",
        ["", "  ", "consultar", "agotado", "no disponible", "—"],
    )
    def test_unparseable_returns_none(self, text: str) -> None:
        assert parse_price(text) is None

    def test_none_input_returns_none(self) -> None:
        assert parse_price(None) is None


class TestParseDateEs:
    @pytest.mark.parametrize(
        "text, expected",
        [
            ("22 de febrero de 2027", date(2027, 2, 22)),
            ("1 de enero de 2026", date(2026, 1, 1)),
            ("31 de diciembre de 2027", date(2027, 12, 31)),
            ("22/02/2027", date(2027, 2, 22)),
            ("01/01/2026", date(2026, 1, 1)),
            # Single-digit day/month (cruceros.cl card format)
            ("16/5/2026", date(2026, 5, 16)),
            ("1/1/2026", date(2026, 1, 1)),
            ("2027-02-22", date(2027, 2, 22)),
            ("22-02-2027", date(2027, 2, 22)),
            # Whitespace and case
            ("  22 DE FEBRERO DE 2027  ", date(2027, 2, 22)),
        ],
    )
    def test_valid_formats(self, text: str, expected: date) -> None:
        assert parse_date_es(text) == expected

    @pytest.mark.parametrize(
        "text",
        ["", "consultar", "32 de febrero de 2027", "abc", "2027/13/01"],
    )
    def test_invalid_returns_none(self, text: str) -> None:
        assert parse_date_es(text) is None

    def test_none_input_returns_none(self) -> None:
        assert parse_date_es(None) is None


class TestNormalizeCabinType:
    @pytest.mark.parametrize(
        "raw, expected",
        [
            ("Suite", "suite"),
            ("Junior Suite", "suite"),
            ("Yacht Club Suite", "suite"),
            ("Balcón", "balcon"),
            ("Balcony", "balcon"),
            ("Cabina con Balcón", "balcon"),
            ("Vista al Mar", "vista"),
            ("Ocean View", "vista"),
            ("Cabina Exterior", "vista"),
            ("Interior", "interior"),
            ("Cabina Interior", "interior"),
            ("desconocido", "interior"),  # default fallback
            ("", "interior"),
        ],
    )
    def test_categories(self, raw: str, expected: str) -> None:
        assert normalize_cabin_type(raw) == expected


class TestItineraryHash:
    def test_deterministic(self) -> None:
        a = itinerary_hash(1, "Caribe Occidental", 7, "Miami")
        b = itinerary_hash(1, "Caribe Occidental", 7, "Miami")
        assert a == b

    def test_case_and_whitespace_invariant(self) -> None:
        a = itinerary_hash(1, "Caribe Occidental", 7, "Miami")
        b = itinerary_hash(1, " caribe OCCIDENTAL  ", 7, " miami ")
        assert a == b

    def test_different_ship_differs(self) -> None:
        a = itinerary_hash(1, "Caribe", 7, "Miami")
        b = itinerary_hash(2, "Caribe", 7, "Miami")
        assert a != b

    def test_different_duration_differs(self) -> None:
        a = itinerary_hash(1, "Caribe", 7, "Miami")
        b = itinerary_hash(1, "Caribe", 14, "Miami")
        assert a != b

    def test_length_is_32(self) -> None:
        h = itinerary_hash(1, "Caribe", 7, "Miami")
        assert len(h) == 32

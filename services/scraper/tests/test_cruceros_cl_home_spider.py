"""Tests for CrucerosClHomeSpider against a real (trimmed) fixture HTML."""
from __future__ import annotations

from datetime import date
from pathlib import Path

import pytest

from scraper.domain.models import CruiseSailing
from scraper.spiders.cruceros_cl import CrucerosClHomeSpider

FIXTURE = Path(__file__).parent / "fixtures" / "cruceros_cl_home.html"


@pytest.fixture
def fixture_html() -> str:
    return FIXTURE.read_text(encoding="utf-8")


def test_parses_two_cards_from_fixture(fixture_html: str) -> None:
    sailings = list(CrucerosClHomeSpider.parse_html(fixture_html))
    assert len(sailings) == 2


def test_first_card_fields(fixture_html: str) -> None:
    sailings = list(CrucerosClHomeSpider.parse_html(fixture_html))
    s = sailings[0]
    assert s == CruiseSailing(
        cruise_line="MSC Cruceros",
        ship="MSC World America",
        itinerary_name="República Dominicana",
        duration_nights=7,
        departure_port="Miami",
        departure_date=date(2026, 5, 16),
        region="republica-dominicana",
        ports_of_call=(),
        cabin_type="from",
        price_usd=577.0,
        source_url=(
            "https://www.cruceros.cl/f-12133148-msc-msc-world-america-republica-dominicana"
        ),
    )


def test_second_card_fields(fixture_html: str) -> None:
    sailings = list(CrucerosClHomeSpider.parse_html(fixture_html))
    s = sailings[1]
    assert s.cruise_line == "MSC Cruceros"
    assert s.ship == "MSC Divina"
    assert s.itinerary_name == "Islas Griegas"
    assert s.duration_nights == 7
    assert s.departure_port == "Civitavecchia - Roma"
    assert s.departure_date == date(2026, 6, 12)
    assert s.region == "islas-griegas"
    assert s.ports_of_call == ()
    assert s.cabin_type == "from"
    assert s.price_usd == 532.0


def test_skips_card_missing_required_fields() -> None:
    """A malformed card (missing .priceStack) must be skipped, not raise."""
    bad_html = """
    <html><body>
      <div class="product-recap-link-9999-XX" data-href="/f-9999-broken">
        <p class="title">Broken Card</p>
        <img alt="Some Line">
        <div class="boatLine"><p>Some Ship</p></div>
        <div class="portLine"><p>desde Nowhere</p></div>
        <div class="durationLine"><p>7 noches</p></div>
        <div class="dateLine"><p>el 1/1/2026</p></div>
        <!-- priceStack missing -->
      </div>
    </body></html>
    """
    sailings = list(CrucerosClHomeSpider.parse_html(bad_html))
    assert sailings == []


def test_no_cards_returns_nothing() -> None:
    sailings = list(CrucerosClHomeSpider.parse_html("<html><body></body></html>"))
    assert sailings == []


def test_site_name() -> None:
    """Sanity: the property returns the registered site name."""
    # We need an instance for the property; use a stub HTTP client.
    from scraper.core.http_client import HttpClient

    client = HttpClient(min_delay=0, max_delay=0, sleep=lambda _: None)
    spider = CrucerosClHomeSpider(client)
    assert spider.site_name == "cruceros_cl_home"
    client.close()

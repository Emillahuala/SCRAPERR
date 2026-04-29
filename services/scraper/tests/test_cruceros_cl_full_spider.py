"""Tests for CrucerosClFullSpider, _extract_itemlist, and _parse_detail_html."""
from __future__ import annotations

from datetime import date
from pathlib import Path
from unittest.mock import MagicMock

from scraper.domain.models import CruiseSailing
from scraper.spiders.cruceros_cl import (
    CrucerosClFullSpider,
    _extract_itemlist,
    _parse_detail_html,
)

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

FIXTURES = Path(__file__).parent / "fixtures"

LISTING_HTML = (FIXTURES / "cruceros_cl_listing.html").read_text(encoding="utf-8")
DETAIL_HTML = (FIXTURES / "cruceros_cl_detail.html").read_text(encoding="utf-8")
DETAIL_MULTIWORD_HTML = (
    FIXTURES / "cruceros_cl_detail_multiword_region.html"
).read_text(encoding="utf-8")


# ---------------------------------------------------------------------------
# _extract_itemlist
# ---------------------------------------------------------------------------


class TestExtractItemlist:
    def test_returns_two_products_from_fixture(self) -> None:
        items = _extract_itemlist(LISTING_HTML)
        assert len(items) == 2

    def test_first_item_id_and_url(self) -> None:
        items = _extract_itemlist(LISTING_HTML)
        first = items[0]
        assert first["@id"] == "7324144"
        assert (
            first["url"]
            == "https://www.cruceros.cl/f-7324144-royal-caribbean-independence-of-the-seas-caribe"
        )

    def test_first_item_price_and_brand(self) -> None:
        items = _extract_itemlist(LISTING_HTML)
        first = items[0]
        assert first["offers"]["price"] == 392
        assert first["brand"]["name"] == "Royal Caribbean"

    def test_second_item_price_and_brand(self) -> None:
        items = _extract_itemlist(LISTING_HTML)
        second = items[1]
        assert second["offers"]["price"] == 413
        assert second["brand"]["name"] == "MSC Cruceros"

    def test_returns_empty_when_no_marker(self) -> None:
        items = _extract_itemlist("<html><body></body></html>")
        assert items == []

    def test_returns_empty_when_no_script_tags(self) -> None:
        # Has the marker text but outside a <script> tag
        html = '<div>"id":"ItemList-schema"</div>'
        items = _extract_itemlist(html)
        assert items == []


# ---------------------------------------------------------------------------
# _parse_detail_html
# ---------------------------------------------------------------------------


class TestParseDetailHtml:
    def test_single_word_region_port(self) -> None:
        meta = _parse_detail_html(DETAIL_HTML)
        assert meta is not None
        assert meta["port"] == "Miami"

    def test_single_word_region_date(self) -> None:
        meta = _parse_detail_html(DETAIL_HTML)
        assert meta is not None
        assert meta["date"] == "2026-12-13"

    def test_single_word_region_price(self) -> None:
        meta = _parse_detail_html(DETAIL_HTML)
        assert meta is not None
        assert meta["price"] == "392"

    def test_single_word_region_ship(self) -> None:
        meta = _parse_detail_html(DETAIL_HTML)
        assert meta is not None
        assert meta["ship"] == "Independence of the Seas"

    def test_single_word_region_nights_from_desc(self) -> None:
        meta = _parse_detail_html(DETAIL_HTML)
        assert meta is not None
        assert meta["nights"] == "8"

    def test_single_word_region_cruise_line_from_desc(self) -> None:
        meta = _parse_detail_html(DETAIL_HTML)
        assert meta is not None
        assert meta["cruise_line"] == "Royal Caribbean"

    def test_multiword_region_port(self) -> None:
        """'Islas Griegas' must not confuse the port extraction."""
        meta = _parse_detail_html(DETAIL_MULTIWORD_HTML)
        assert meta is not None
        assert meta["port"] == "Civitavecchia - Roma"

    def test_multiword_region_date(self) -> None:
        meta = _parse_detail_html(DETAIL_MULTIWORD_HTML)
        assert meta is not None
        assert meta["date"] == "2026-05-01"

    def test_multiword_region_price(self) -> None:
        meta = _parse_detail_html(DETAIL_MULTIWORD_HTML)
        assert meta is not None
        assert meta["price"] == "338"

    def test_multiword_region_ship(self) -> None:
        meta = _parse_detail_html(DETAIL_MULTIWORD_HTML)
        assert meta is not None
        assert meta["ship"] == "MSC Divina"

    def test_returns_none_for_non_sailing_page(self) -> None:
        html = "<html><head><title>404 - Not Found</title></head></html>"
        assert _parse_detail_html(html) is None

    def test_returns_none_for_empty_title(self) -> None:
        assert _parse_detail_html("<html><head></head></html>") is None


# ---------------------------------------------------------------------------
# CrucerosClFullSpider integration
# ---------------------------------------------------------------------------


def _make_spider(url_map: dict[str, str | None]) -> CrucerosClFullSpider:
    """Build a spider with a mock HttpClient that resolves URLs from *url_map*."""
    mock_http = MagicMock()
    mock_http.get_html.side_effect = lambda url: url_map.get(url)
    return CrucerosClFullSpider(mock_http, regions={"caribe": "/d-7541-caribe"})


class TestCrucerosClFullSpider:
    BASE = "https://www.cruceros.cl"
    DETAIL_URL_1 = f"{BASE}/f-7324144-royal-caribbean-independence-of-the-seas-caribe"
    DETAIL_URL_2 = f"{BASE}/f-12249231-msc-msc-seashore-caribe"

    def _url_map(self) -> dict[str, str | None]:
        return {
            f"{self.BASE}/d-7541-caribe?page=1": LISTING_HTML,
            self.DETAIL_URL_1: DETAIL_HTML,
            self.DETAIL_URL_2: DETAIL_HTML,
            # page=2 returns None → stops pagination
            f"{self.BASE}/d-7541-caribe?page=2": None,
        }

    def test_site_name(self) -> None:
        spider = _make_spider({})
        assert spider.site_name == "cruceros_cl"

    def test_yields_two_sailings(self) -> None:
        spider = _make_spider(self._url_map())
        sailings = list(spider.scrape())
        assert len(sailings) == 2

    def test_first_sailing_fields(self) -> None:
        spider = _make_spider(self._url_map())
        s = next(iter(spider.scrape()))

        assert s == CruiseSailing(
            cruise_line="Royal Caribbean",
            ship="Independence of the Seas",
            itinerary_name="Estados Unidos, Puerto Rico, Bahamas, Reino Unido",
            duration_nights=8,
            departure_port="Miami",
            departure_date=date(2026, 12, 13),
            region="caribe",
            ports_of_call=(
                "Estados Unidos",
                "Puerto Rico",
                "Bahamas",
                "Reino Unido",
            ),
            cabin_type="interior",
            price_usd=392.0,
            source_url=self.DETAIL_URL_1,
        )

    def test_second_sailing_cruise_line_from_brand(self) -> None:
        """Brand name from listing should take precedence over meta description."""
        spider = _make_spider(self._url_map())
        s = list(spider.scrape())[1]
        assert s.cruise_line == "MSC Cruceros"

    def test_second_sailing_price_from_listing(self) -> None:
        spider = _make_spider(self._url_map())
        s = list(spider.scrape())[1]
        assert s.price_usd == 413.0

    def test_second_sailing_source_url(self) -> None:
        spider = _make_spider(self._url_map())
        s = list(spider.scrape())[1]
        assert s.source_url == self.DETAIL_URL_2

    def test_second_sailing_ports_of_call_no_comma(self) -> None:
        """'Caribe Mexico' has no comma → single-element tuple."""
        spider = _make_spider(self._url_map())
        s = list(spider.scrape())[1]
        assert s.ports_of_call == ("Caribe Mexico",)

    def test_skips_item_when_detail_fetch_fails(self) -> None:
        url_map = {
            f"{self.BASE}/d-7541-caribe?page=1": LISTING_HTML,
            self.DETAIL_URL_1: None,   # fetch fails
            self.DETAIL_URL_2: DETAIL_HTML,
            f"{self.BASE}/d-7541-caribe?page=2": None,
        }
        spider = _make_spider(url_map)
        sailings = list(spider.scrape())
        # Only second item survives
        assert len(sailings) == 1
        assert sailings[0].price_usd == 413.0

    def test_stops_when_listing_fetch_fails(self) -> None:
        url_map = {
            f"{self.BASE}/d-7541-caribe?page=1": None,
        }
        spider = _make_spider(url_map)
        assert list(spider.scrape()) == []

    def test_stops_when_listing_has_no_items(self) -> None:
        url_map = {
            f"{self.BASE}/d-7541-caribe?page=1": "<html><body></body></html>",
        }
        spider = _make_spider(url_map)
        assert list(spider.scrape()) == []

    def test_deduplicates_ids_across_pages(self) -> None:
        """Same item IDs on page=2 must not yield duplicate sailings."""
        url_map = {
            f"{self.BASE}/d-7541-caribe?page=1": LISTING_HTML,
            self.DETAIL_URL_1: DETAIL_HTML,
            self.DETAIL_URL_2: DETAIL_HTML,
            # page=2 returns the same listing (same IDs)
            f"{self.BASE}/d-7541-caribe?page=2": LISTING_HTML,
            # page=3 → None to stop
            f"{self.BASE}/d-7541-caribe?page=3": None,
        }
        spider = _make_spider(url_map)
        sailings = list(spider.scrape())
        # Deduplication is per-region, reset each region:
        # page 1 → 2 new items; page 2 → 0 new (already seen) → items list non-empty
        # so pagination continues until page=3 returns None.
        assert len(sailings) == 2

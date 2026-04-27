"""Spiders for cruceros.cl.

Currently provides a homepage spider that yields the ~32 featured deals from
the carousel on the landing page. The full per-region spider (paginated
listings + detail pages with per-cabin price tables) will land alongside it
when we have HTML samples of those pages.
"""
from __future__ import annotations

import re
import unicodedata
from collections.abc import Iterator
from typing import Final
from urllib.parse import urljoin

import structlog
from selectolax.parser import HTMLParser, Node

from scraper.core.base_scraper import BaseScraper
from scraper.core.http_client import HttpClient
from scraper.domain.models import CruiseSailing
from scraper.domain.normalizer import parse_date_es, parse_price

logger = structlog.get_logger(__name__)


class CrucerosClHomeSpider(BaseScraper):
    """Scrapes the cruceros.cl homepage carousel.

    The homepage shows ~32 hand-picked featured deals. Each card lacks the
    per-cabin price breakdown (only a "desde US$X" headline price) so we use
    ``cabin_type='from'`` for these entries. ``ports_of_call`` is empty
    because the homepage doesn't list intermediate stops.

    Use this spider as a stop-gap until the full region spider lands; do not
    rely on it for completeness.
    """

    BASE_URL: Final[str] = "https://www.cruceros.cl"

    def __init__(self, http_client: HttpClient) -> None:
        self._http = http_client

    @property
    def site_name(self) -> str:
        return "cruceros_cl_home"

    def scrape(self) -> Iterator[CruiseSailing]:
        html = self._http.get_html(self.BASE_URL)
        if html is None:
            logger.error("homepage_fetch_failed", url=self.BASE_URL)
            return
        yield from self.parse_html(html)

    @classmethod
    def parse_html(cls, html: str) -> Iterator[CruiseSailing]:
        """Parse a homepage HTML payload. Used directly by tests with fixtures."""
        tree = HTMLParser(html)
        cards = tree.css('div[class*="product-recap-link-"]')
        for idx, card in enumerate(cards):
            sailing = cls._parse_card(card)
            if sailing is None:
                logger.warning("card_parse_skipped", idx=idx)
                continue
            yield sailing

    @classmethod
    def _parse_card(cls, card: Node) -> CruiseSailing | None:
        """Extract a CruiseSailing from one card. Returns None on missing data."""
        href = card.attributes.get("data-href")
        title_el = card.css_first(".title")
        img_el = card.css_first("img[alt]")
        boat_el = card.css_first(".boatLine p")
        port_el = card.css_first(".portLine p")
        dur_el = card.css_first(".durationLine p")
        date_el = card.css_first(".dateLine p")
        price_el = card.css_first(".priceStack")

        if (
            not href
            or title_el is None
            or img_el is None
            or boat_el is None
            or port_el is None
            or dur_el is None
            or date_el is None
            or price_el is None
        ):
            return None

        cruise_line = (img_el.attributes.get("alt") or "").strip()
        ship = boat_el.text(strip=True)
        title = title_el.text(strip=True)
        port = _strip_prefix(port_el.text(strip=True), "desde")
        duration = _extract_nights(dur_el.text(strip=True))
        departure = parse_date_es(_strip_prefix(date_el.text(strip=True), "el"))
        price = parse_price(price_el.text())

        if (
            not cruise_line
            or not ship
            or not title
            or not port
            or duration is None
            or departure is None
            or price is None
        ):
            return None

        return CruiseSailing(
            cruise_line=cruise_line,
            ship=ship,
            itinerary_name=title,
            duration_nights=duration,
            departure_port=port,
            departure_date=departure,
            region=_slugify(title),
            ports_of_call=(),
            cabin_type="from",
            price_usd=price,
            source_url=urljoin(cls.BASE_URL, href),
        )


_NIGHTS_RE = re.compile(r"(\d+)\s*noches?", re.IGNORECASE)


def _strip_prefix(text: str, prefix: str) -> str:
    cleaned = text.strip()
    if cleaned.lower().startswith(prefix.lower()):
        return cleaned[len(prefix):].strip()
    return cleaned


def _extract_nights(text: str) -> int | None:
    match = _NIGHTS_RE.search(text)
    return int(match.group(1)) if match else None


def _slugify(text: str) -> str:
    """Lowercase, accent-stripped, hyphenated slug. ``República`` → ``republica``."""
    no_accents = (
        unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    )
    return re.sub(r"[^\w]+", "-", no_accents.lower()).strip("-")

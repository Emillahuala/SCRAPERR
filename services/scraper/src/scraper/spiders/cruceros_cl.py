"""Spiders for cruceros.cl.

Two spiders are provided:

* ``CrucerosClHomeSpider`` — scrapes the homepage carousel (~32 featured deals).
  Each card has only a "desde US$X" price, so ``cabin_type='from'`` is used.
  Stop-gap until the full spider covers all regions.

* ``CrucerosClFullSpider`` — paginates per-region listing pages, then fetches
  each sailing's detail page to extract per-sailing metadata from the SSR HTML.

Implementation notes
--------------------
cruceros.cl is built with Next.js App Router.  The JSON-LD schemas injected by
React are NOT in the raw HTML; instead they arrive via ``__next_s`` push scripts
which httpx receives in the initial HTTP response (the page is SSR-streamed).

- Listing pages: each ``<script>`` that pushes ``"id":"ItemList-schema"`` holds
  a JSON string with up to 10 Product offers.  Prices are "from" prices
  (cheapest interior cabin).

- Detail pages: all per-cabin price breakdowns are rendered client-side by React
  (confirmed via httpx fetch vs browser comparison).  The only reliable
  SSR sources are ``<title>`` and ``<meta name="description">``, from which we
  extract port, date, ship and duration using stable regex patterns.

  Known limitation: only ``cabin_type='interior'`` is available via SSR.
  Per-cabin breakdown (exterior / balcón / suite) requires a headless browser —
  deferred to a post-MVP phase.
"""
from __future__ import annotations

import json
import re
import unicodedata
from collections.abc import Iterator
from datetime import date
from typing import Final
from urllib.parse import urljoin

import structlog
from selectolax.parser import HTMLParser, Node

from scraper.core.base_scraper import BaseScraper
from scraper.core.http_client import HttpClient
from scraper.domain.models import CruiseSailing
from scraper.domain.normalizer import parse_date_es, parse_price

logger = structlog.get_logger(__name__)

BASE_URL: Final[str] = "https://www.cruceros.cl"

# ---------------------------------------------------------------------------
# Detail-page SSR patterns
# ---------------------------------------------------------------------------

# Title: "Crucero Islas Griegas  salida de Civitavecchia - Roma, le 2026-05-01
#          desde US$ 338 a bordo del MSC Divina"
# Region can be multiple words ("Islas Griegas", "Fiordos y Escandinavia").
_TITLE_RE: Final = re.compile(
    r"Crucero\s+.+?\s+salida de\s+(?P<port>[^,]+?)\s*,"
    r"\s+le\s+(?P<date>\d{4}-\d{2}-\d{2})\s+"
    r"desde\s+US\$\s*(?P<price>[\d,]+)\s+"
    r"a bordo de(?:l|la|los|las)?\s+(?P<ship>.+)$",
    re.IGNORECASE,
)

# Description: "Reserva un crucero Caribe de 8 noches desde US$ 392 a bordo
#               del Independence of the Seas (Royal Caribbean) con salida…"
_DESC_RE: Final = re.compile(
    r"(?P<nights>\d+)\s+noches?\s+desde.*?"
    r"a bordo de(?:l|la|los|las)?\s+[^(]+\((?P<cruise_line>[^)]+)\)",
    re.IGNORECASE,
)

# ---------------------------------------------------------------------------
# Listing-page __next_s helpers
# ---------------------------------------------------------------------------

def _extract_itemlist(html: str) -> list[dict]:  # type: ignore[type-arg]
    """Return the 10 Product dicts from the ``__next_s`` ItemList-schema push.

    Next.js App Router injects JSON-LD via:
      (self.__next_s=self.__next_s||[]).push([0,{
        "type":"application/ld+json",
        "children":"{\\"@type\\":\\"ItemList\\", ...}",
        "id":"ItemList-schema"
      }])

    The ``children`` value is a JSON string with \\"-escaped inner quotes.
    We locate the enclosing ``<script>`` tag, extract the raw string, decode
    the double-escaping, then parse the inner JSON.
    """
    marker = '"id":"ItemList-schema"'
    pos = html.find(marker)
    if pos == -1:
        return []

    # Walk back to the opening <script> tag.
    script_start = html.rfind("<script>", 0, pos)
    script_end = html.find("</script>", pos)
    if script_start == -1 or script_end == -1:
        return []

    script = html[script_start: script_end + 9]

    # Locate the push([0, {…}]) body.
    push_m = re.search(r"push\(\[0,(\{)", script)
    if not push_m:
        return []

    body = script[push_m.start(1):]
    end = body.find("}])")
    if end == -1:
        return []
    body = body[: end + 1]

    # Extract raw children string between '"children":"' and '","id":'.
    ch_start = body.find('"children":"') + len('"children":"')
    ch_end = body.rfind('","id":')
    if ch_start <= len('"children":"') - 1 or ch_end <= 0:
        return []

    raw = body[ch_start:ch_end]
    # Decode double-escaping: \\" → "   \\\\ → \\
    children_str = raw.replace('\\"', '"').replace("\\\\", "\\")

    try:
        data = json.loads(children_str)
    except json.JSONDecodeError as exc:
        logger.warning("itemlist_json_decode_error", error=str(exc))
        return []

    return data.get("itemListElement", [])


def _parse_detail_html(html: str) -> dict[str, str] | None:
    """Extract departure metadata from the detail page ``<title>`` + ``<meta>``.

    Returns a dict with keys: port, date, price, ship, nights, cruise_line.
    Returns ``None`` if the title pattern does not match (non-sailing page).
    """
    title_m = re.search(r"<title>([^<]+)</title>", html)
    desc_m = re.search(r'<meta name="description" content="([^"]+)"', html)

    title = title_m.group(1).strip() if title_m else ""
    desc = desc_m.group(1).strip() if desc_m else ""

    tm = _TITLE_RE.search(title)
    if not tm:
        logger.debug("detail_title_no_match", title=title[:120])
        return None

    result: dict[str, str] = {
        "port": tm.group("port").strip(),
        "date": tm.group("date"),
        "price": tm.group("price"),
        "ship": tm.group("ship").strip(),
        "nights": "",
        "cruise_line": "",
    }

    dm = _DESC_RE.search(desc)
    if dm:
        result["nights"] = dm.group("nights")
        result["cruise_line"] = dm.group("cruise_line").strip()

    return result


# ---------------------------------------------------------------------------
# Full per-region spider
# ---------------------------------------------------------------------------

class CrucerosClFullSpider(BaseScraper):
    """Scrapes cruceros.cl by paginating region listing pages.

    Strategy:
    1. For each configured region, fetch ``/d-{id}-{slug}?page=N``.
    2. Parse the ``__next_s`` ItemList-schema push to get up to 10 sailing URLs.
    3. For each new sailing URL, fetch the detail page.
    4. Parse ``<title>`` + ``<meta name="description">`` for departure metadata.
    5. Yield one ``CruiseSailing`` per sailing (``cabin_type='interior'``).

    Duplicate URLs within a run are skipped via ``_seen_ids``.
    """

    MAX_PAGES: Final[int] = 5  # 10 sailings/page x 5 pages x 5 regions ~= 275 requests

    def __init__(self, http_client: HttpClient, regions: dict[str, str]) -> None:
        self._http = http_client
        self._regions = regions  # {"caribe": "/d-7541-caribe", …}

    @property
    def site_name(self) -> str:
        return "cruceros_cl"

    def scrape(self) -> Iterator[CruiseSailing]:
        for region_name, region_path in self._regions.items():
            logger.info("region_started", region=region_name, path=region_path)
            yield from self._scrape_region(region_name, region_path)

    def _scrape_region(self, region: str, path: str) -> Iterator[CruiseSailing]:
        seen_ids: set[str] = set()

        for page in range(1, self.MAX_PAGES + 1):
            url = f"{BASE_URL}{path}?page={page}"
            html = self._http.get_html(url)
            if html is None:
                logger.warning("listing_fetch_failed", url=url)
                break

            items = _extract_itemlist(html)
            if not items:
                logger.info("listing_empty", url=url, page=page)
                break

            logger.info("listing_fetched", region=region, page=page, items=len(items))

            new_items = [i for i in items if str(i.get("@id", "")) not in seen_ids]
            for item in new_items:
                seen_ids.add(str(item.get("@id", "")))

            for item in new_items:
                sailing = self._scrape_item(item, region)
                if sailing is not None:
                    yield sailing

    def _scrape_item(self, item: dict, region: str) -> CruiseSailing | None:  # type: ignore[type-arg]
        """Fetch the detail page for one listing item and build a CruiseSailing."""
        sailing_url: str = item.get("url") or item.get("offers", {}).get("url") or ""
        if not sailing_url:
            logger.warning("item_missing_url", item_id=item.get("@id"))
            return None

        html = self._http.get_html(sailing_url)
        if html is None:
            logger.warning("detail_fetch_failed", url=sailing_url)
            return None

        meta = _parse_detail_html(html)
        if meta is None:
            logger.warning("detail_parse_failed", url=sailing_url)
            return None

        # Price: prefer listing page value (already numeric) over parsed text.
        price_raw = item.get("offers", {}).get("price")
        try:
            price_usd = float(price_raw) if price_raw is not None else None
        except (TypeError, ValueError):
            price_usd = parse_price(meta.get("price"))

        if price_usd is None:
            logger.warning("price_missing", url=sailing_url)
            return None

        # Departure date: YYYY-MM-DD string from the title regex.
        try:
            dep_date = date.fromisoformat(meta["date"])
        except (KeyError, ValueError):
            logger.warning("date_parse_failed", url=sailing_url, raw=meta.get("date"))
            return None

        # Duration: prefer description match, fall back to 0.
        nights_raw = meta.get("nights", "")
        try:
            duration = int(nights_raw) if nights_raw else 0
        except ValueError:
            duration = 0

        # Ship: from title. Cruise line: from listing or description.
        ship = meta.get("ship") or ""
        cruise_line = (
            item.get("brand", {}).get("name")
            or meta.get("cruise_line")
            or ""
        )
        if not ship or not cruise_line:
            logger.warning(
                "ship_or_line_missing",
                url=sailing_url,
                ship=ship,
                cruise_line=cruise_line,
            )
            return None

        # Itinerary name + ports_of_call from the listing item's ``name`` field.
        itinerary_name: str = item.get("name") or region
        ports_of_call = tuple(
            p.strip() for p in itinerary_name.split(",") if p.strip()
        )

        return CruiseSailing(
            cruise_line=cruise_line,
            ship=ship,
            itinerary_name=itinerary_name,
            duration_nights=duration,
            departure_port=meta.get("port") or "",
            departure_date=dep_date,
            region=region,
            ports_of_call=ports_of_call,
            cabin_type="interior",
            price_usd=price_usd,
            source_url=sailing_url,
        )


# ---------------------------------------------------------------------------
# Homepage carousel spider  (original stop-gap, kept for backwards compat)
# ---------------------------------------------------------------------------

class CrucerosClHomeSpider(BaseScraper):
    """Scrapes the cruceros.cl homepage carousel.

    The homepage shows ~32 hand-picked featured deals. Each card lacks the
    per-cabin price breakdown (only a "desde US$X" headline price) so we use
    ``cabin_type='from'`` for these entries. ``ports_of_call`` is empty
    because the homepage doesn't list intermediate stops.

    Use this spider as a stop-gap until the full region spider lands; do not
    rely on it for completeness.
    """

    def __init__(self, http_client: HttpClient) -> None:
        self._http = http_client

    @property
    def site_name(self) -> str:
        return "cruceros_cl_home"

    def scrape(self) -> Iterator[CruiseSailing]:
        html = self._http.get_html(BASE_URL)
        if html is None:
            logger.error("homepage_fetch_failed", url=BASE_URL)
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
            source_url=urljoin(BASE_URL, href),
        )


# ---------------------------------------------------------------------------
# Helpers (shared between spiders)
# ---------------------------------------------------------------------------

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

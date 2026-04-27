# Especificación del scraper

## Objetivo
Extraer ofertas de cruceros.cl, normalizarlas y persistirlas en Supabase manteniendo
histórico completo de precios.

## Sitio objetivo: cruceros.cl

### Estructura observada
- Agregador con ~9.000 ofertas de 30+ navieras (MSC, Royal Caribbean, Costa, etc.)
- HTML server-side rendered (no SPA), perfecto para `httpx` + `selectolax`.
- URLs por región: `/d-26-caribe`, `/d-25-mediterraneo`, `/d-113-sudamerica`,
  `/d-30-fiordos`, `/d-540-chile`.
- Listados paginados con `?page=N`.
- Detalle de cada itinerario muestra tabla de precios por cabina y fecha de zarpe.

### Regiones a scrapear (configurable)
```python
REGIONS = {
    "caribe":       "/d-26-caribe",
    "mediterraneo": "/d-25-mediterraneo",
    "sudamerica":   "/d-113-sudamerica",
    "fiordos":      "/d-30-fiordos",
    "chile":        "/d-540-chile",
}
```

> **IMPORTANTE**: los selectores CSS exactos deben confirmarse inspeccionando el
> sitio en una sesión interactiva. No los inventes. Si Claude Code no tiene acceso
> al sitio, debe pedirte HTML de muestra o detener la implementación.

## Modelo de dominio

```python
# services/scraper/src/scraper/domain/models.py
from dataclasses import dataclass
from datetime import date

@dataclass(frozen=True)
class CruiseSailing:
    """Representa un zarpe específico con precio para una cabina concreta."""
    cruise_line: str          # "MSC Cruceros"
    ship: str                 # "MSC Seaview"
    itinerary_name: str       # "Caribe Occidental 7 noches"
    duration_nights: int      # 7
    departure_port: str       # "Miami"
    departure_date: date      # 2027-02-22
    region: str               # "caribe"
    ports_of_call: list[str]  # ["Cozumel", "Roatán", ...]
    cabin_type: str           # "interior" | "vista" | "balcon" | "suite"
    price_usd: float          # 1080.00
    source_url: str           # URL canónica del detalle
```

## Arquitectura del scraper

### Clase base abstracta
```python
# services/scraper/src/scraper/core/base_scraper.py
from abc import ABC, abstractmethod
from collections.abc import Iterator

class BaseScraper(ABC):
    """Contrato común para todos los spiders."""

    @abstractmethod
    def scrape(self) -> Iterator[CruiseSailing]:
        """Genera CruiseSailing válidos. Aplica retry, rate limiting interno."""
        ...

    @property
    @abstractmethod
    def site_name(self) -> str:
        ...
```

### Spider para cruceros.cl
```python
# services/scraper/src/scraper/spiders/cruceros_cl.py
class CrucerosClScraper(BaseScraper):
    """
    Scraper para cruceros.cl.

    Estrategia:
    1. Para cada región configurada, recorrer páginas hasta no encontrar más cards.
    2. De cada card extraer URL de detalle.
    3. En el detalle parsear tabla de precios (cabin × fecha → precio).
    4. Yield CruiseSailing por cada combinación.
    """

    BASE_URL = "https://www.cruceros.cl"
    site_name = "cruceros_cl"

    def __init__(self, http_client: HttpClient, regions: dict[str, str]):
        self._http = http_client
        self._regions = regions

    def scrape(self) -> Iterator[CruiseSailing]:
        for region_name, region_path in self._regions.items():
            yield from self._scrape_region(region_name, region_path)

    def _scrape_region(self, region: str, path: str) -> Iterator[CruiseSailing]:
        page = 1
        max_pages = 50  # safety guard
        while page <= max_pages:
            url = f"{self.BASE_URL}{path}?page={page}"
            html = self._http.get_html(url)
            if not html:
                break
            cards = self._extract_cards(html)
            if not cards:
                break
            for card_url in cards:
                try:
                    yield from self._scrape_detail(card_url, region)
                except Exception as exc:
                    logger.warning("detail_scrape_failed",
                                   url=card_url, error=str(exc))
            page += 1
```

### Cliente HTTP con anti-bloqueo
```python
# services/scraper/src/scraper/core/http_client.py
import random
import time
import httpx
import structlog

logger = structlog.get_logger()

USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3) AppleWebKit/605.1.15 ...",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ...",
    # Añadir más UAs reales
]

class HttpClient:
    def __init__(self, timeout: int = 30, min_delay: float = 2.0, max_delay: float = 5.0):
        self._client = httpx.Client(timeout=timeout, follow_redirects=True)
        self._min_delay = min_delay
        self._max_delay = max_delay

    def get_html(self, url: str, max_attempts: int = 3) -> str | None:
        for attempt in range(max_attempts):
            try:
                self._sleep_human()
                response = self._client.get(url, headers=self._headers())
                if response.status_code == 200:
                    return response.text
                if response.status_code == 429:
                    logger.warning("rate_limited", url=url, attempt=attempt)
                    time.sleep((2 ** attempt) * 5)
                    continue
                logger.warning("non_200", url=url, status=response.status_code)
            except httpx.RequestError as exc:
                logger.warning("request_failed", url=url, error=str(exc), attempt=attempt)
                time.sleep(2 ** attempt)
        return None

    def _headers(self) -> dict[str, str]:
        return {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "es-CL,es;q=0.9,en;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "DNT": "1",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
        }

    def _sleep_human(self) -> None:
        time.sleep(random.uniform(self._min_delay, self._max_delay))
```

### Normalización
```python
# services/scraper/src/scraper/domain/normalizer.py
import hashlib
import re
from datetime import date, datetime

def parse_price(text: str) -> float | None:
    """
    Extrae el primer número como precio.
    Maneja formatos: 'US$1.080', 'USD 1,080.00', '$1080', 'desde US$1.080'.
    """
    if not text:
        return None
    cleaned = text.replace(".", "").replace(",", ".")
    match = re.search(r"(\d+(?:\.\d+)?)", cleaned)
    return float(match.group(1)) if match else None

def parse_date_es(text: str) -> date | None:
    """Parsea fechas en español: '22 de febrero de 2027', '22/02/2027', etc."""
    if not text:
        return None
    text = text.strip().lower()
    months_es = {
        "enero": 1, "febrero": 2, "marzo": 3, "abril": 4,
        "mayo": 5, "junio": 6, "julio": 7, "agosto": 8,
        "septiembre": 9, "octubre": 10, "noviembre": 11, "diciembre": 12,
    }
    # Formato "22 de febrero de 2027"
    m = re.match(r"(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})", text)
    if m:
        day, month_name, year = m.groups()
        month = months_es.get(month_name)
        if month:
            return date(int(year), month, int(day))
    # Formato "22/02/2027"
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            continue
    return None

def normalize_cabin_type(text: str) -> str:
    """Mapea descripciones libres a categorías canónicas."""
    text = text.lower().strip()
    if "suite" in text:
        return "suite"
    if "balc" in text or "balcony" in text:
        return "balcon"
    if "vista" in text or "ocean view" in text or "exterior" in text:
        return "vista"
    return "interior"

def itinerary_hash(ship_id: int, name: str, duration: int, port: str) -> str:
    """Hash determinístico para deduplicar itinerarios."""
    raw = f"{ship_id}|{name.strip().lower()}|{duration}|{port.strip().lower()}"
    return hashlib.sha256(raw.encode()).hexdigest()[:32]
```

### Pipeline a Supabase
```python
# services/scraper/src/scraper/pipelines/supabase_pipeline.py
class SupabasePipeline:
    """
    Persiste CruiseSailing en Supabase con cache local para reducir queries.
    """

    def __init__(self, supabase: Client):
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

    def _upsert_itinerary(self, ship_id: int, s: CruiseSailing) -> int:
        hash_key = itinerary_hash(ship_id, s.itinerary_name, s.duration_nights, s.departure_port)
        if hash_key in self._itinerary_cache:
            return self._itinerary_cache[hash_key]
        result = self._db.table("itineraries").upsert({
            "ship_id": ship_id,
            "name": s.itinerary_name,
            "duration_nights": s.duration_nights,
            "departure_port": s.departure_port,
            "region": s.region,
            "ports_of_call": s.ports_of_call,
            "hash_key": hash_key,
        }, on_conflict="hash_key").execute()
        itinerary_id = result.data[0]["id"]
        self._itinerary_cache[hash_key] = itinerary_id
        return itinerary_id

    def _insert_price(self, sailing_id: int, s: CruiseSailing) -> None:
        self._db.table("price_history").insert({
            "sailing_id": sailing_id,
            "cabin_type": s.cabin_type,
            "price_usd": s.price_usd,
            "available": True,
        }).execute()
```

### CLI
```python
# services/scraper/src/scraper/cli.py
import typer
from .config import Settings
from .core.http_client import HttpClient
from .pipelines.supabase_pipeline import SupabasePipeline
from .spiders.cruceros_cl import CrucerosClScraper

app = typer.Typer()

@app.command()
def run(
    site: str = typer.Option(..., help="Sitio a scrapear: cruceros_cl"),
    dry_run: bool = typer.Option(False, help="No persistir, solo loguear"),
    max_items: int | None = typer.Option(None, help="Límite para testing"),
):
    settings = Settings()
    http = HttpClient()

    if site == "cruceros_cl":
        scraper = CrucerosClScraper(http, regions=settings.regions)
    else:
        raise typer.BadParameter(f"Site '{site}' not supported")

    pipeline = None if dry_run else SupabasePipeline(settings.supabase_client())

    count = 0
    for sailing in scraper.scrape():
        if max_items and count >= max_items:
            break
        if pipeline:
            pipeline.process(sailing)
        else:
            print(sailing)
        count += 1

    typer.echo(f"Processed {count} sailings")

if __name__ == "__main__":
    app()
```

## Tests obligatorios

Crear fixtures HTML reales (descargados manualmente de cruceros.cl) en
`services/scraper/tests/fixtures/` y testear:

1. **`test_normalizer.py`**:
   - `parse_price` con todos los formatos vistos en producción.
   - `parse_date_es` con fechas en español y numéricas.
   - `normalize_cabin_type` con variaciones reales.
   - `itinerary_hash` determinístico (mismo input → mismo output).

2. **`test_cruceros_cl_parser.py`**:
   - Cargar fixture `cruceros_cl_listing.html` y verificar que extrae N cards.
   - Cargar fixture `cruceros_cl_detail.html` y verificar parseo correcto de la tabla.
   - Verificar que sin precio o sin fecha, el item se descarta sin romper.

3. **`test_supabase_pipeline.py`** (con mocks):
   - Verificar caché funciona (mismo cruise_line → no se llama upsert dos veces).
   - Verificar formato exacto de payload enviado a Supabase.

## Anti-bloqueo (estrategia mínima viable)
- Rotación de User-Agents reales (no usar listas públicas).
- Headers coherentes (`Accept-Language: es-CL,es;q=0.9`).
- Delays aleatorios 2-5s entre requests.
- Backoff exponencial en 429.
- Si los bloqueos suben, considerar proxies residenciales (no datacenter).

## Logging
Todo log via `structlog` en JSON:
```python
logger.info("sailing_processed", cruise_line=s.cruise_line, price=s.price_usd)
logger.warning("parse_failed", url=url, field="price", raw=text)
logger.error("scrape_aborted", region=region, exc_info=exc)
```

"""Common contract for all spiders."""
from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import Iterator

from scraper.domain.models import CruiseSailing


class BaseScraper(ABC):
    """All site-specific spiders implement this interface.

    A spider is responsible for fetching pages, parsing them and yielding
    valid CruiseSailing instances. Pacing, retries and rate limiting are
    handled internally (typically delegated to an injected HTTP client).
    """

    @property
    @abstractmethod
    def site_name(self) -> str:
        """Stable identifier used in logs and CLI flags (e.g. ``cruceros_cl``)."""

    @abstractmethod
    def scrape(self) -> Iterator[CruiseSailing]:
        """Yield valid CruiseSailing instances. Skips malformed items silently."""

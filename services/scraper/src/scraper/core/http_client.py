"""Synchronous HTTP client with retry, backoff and basic anti-block hygiene."""
from __future__ import annotations

import random
import time
from collections.abc import Callable
from typing import Final

import httpx
import structlog

logger = structlog.get_logger(__name__)

# Real desktop User-Agents. Keep this list short and rotate via random.choice.
USER_AGENTS: Final[tuple[str, ...]] = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Version/17.3 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
)


class HttpClient:
    """Thin wrapper around httpx.Client with retries, UA rotation and pacing.

    The sleep callable is injectable so tests can avoid real delays.
    """

    def __init__(
        self,
        timeout: int = 30,
        min_delay: float = 2.0,
        max_delay: float = 5.0,
        max_attempts: int = 3,
        sleep: Callable[[float], None] | None = None,
        client: httpx.Client | None = None,
    ) -> None:
        self._client = client or httpx.Client(timeout=timeout, follow_redirects=True)
        self._min_delay = min_delay
        self._max_delay = max_delay
        self._max_attempts = max_attempts
        self._sleep = sleep or time.sleep

    def get_html(self, url: str) -> str | None:
        """Fetch a URL and return the body, or ``None`` on persistent failure.

        Returns ``None`` (does not raise) so callers can decide whether to skip
        a single page or abort the whole run.
        """
        for attempt in range(self._max_attempts):
            try:
                self._pace()
                response = self._client.get(url, headers=self._headers())
                if response.status_code == 200:
                    return response.text
                if response.status_code == 429:
                    backoff = (2**attempt) * 5
                    logger.warning("rate_limited", url=url, attempt=attempt, backoff=backoff)
                    self._sleep(backoff)
                    continue
                logger.warning(
                    "non_200_response",
                    url=url,
                    status=response.status_code,
                    attempt=attempt,
                )
            except httpx.RequestError as exc:
                logger.warning(
                    "request_failed", url=url, error=str(exc), attempt=attempt
                )
                self._sleep(2**attempt)
        logger.error("get_html_exhausted_attempts", url=url, attempts=self._max_attempts)
        return None

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> HttpClient:
        return self

    def __exit__(self, *_: object) -> None:
        self.close()

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

    def _pace(self) -> None:
        if self._max_delay <= 0:
            return
        delay = random.uniform(self._min_delay, self._max_delay)
        self._sleep(delay)

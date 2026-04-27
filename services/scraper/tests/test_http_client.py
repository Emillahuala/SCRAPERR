"""Tests for HttpClient using respx mocks. No real HTTP traffic."""
from __future__ import annotations

import httpx
import pytest
import respx

from scraper.core.http_client import HttpClient


@pytest.fixture
def no_sleep() -> list[float]:
    """Capture sleeps instead of actually sleeping. Returned list records calls."""
    calls: list[float] = []
    return calls


@pytest.fixture
def client(no_sleep: list[float]) -> HttpClient:
    return HttpClient(
        min_delay=0,
        max_delay=0,
        max_attempts=3,
        sleep=no_sleep.append,
    )


@respx.mock
def test_returns_body_on_200(client: HttpClient) -> None:
    respx.get("https://example.test/page").mock(
        return_value=httpx.Response(200, text="<html>hello</html>")
    )
    assert client.get_html("https://example.test/page") == "<html>hello</html>"


@respx.mock
def test_returns_none_on_persistent_500(client: HttpClient) -> None:
    respx.get("https://example.test/page").mock(
        return_value=httpx.Response(500)
    )
    assert client.get_html("https://example.test/page") is None


@respx.mock
def test_retries_on_429_then_succeeds(client: HttpClient, no_sleep: list[float]) -> None:
    route = respx.get("https://example.test/page").mock(
        side_effect=[
            httpx.Response(429),
            httpx.Response(200, text="ok"),
        ]
    )
    assert client.get_html("https://example.test/page") == "ok"
    assert route.call_count == 2
    # Backoff was applied (2**0 * 5 = 5s) — captured but not slept.
    assert 5 in no_sleep


@respx.mock
def test_retries_on_request_error(client: HttpClient, no_sleep: list[float]) -> None:
    route = respx.get("https://example.test/page").mock(
        side_effect=[
            httpx.ConnectError("boom"),
            httpx.Response(200, text="recovered"),
        ]
    )
    assert client.get_html("https://example.test/page") == "recovered"
    assert route.call_count == 2


@respx.mock
def test_gives_up_after_max_attempts(no_sleep: list[float]) -> None:
    client = HttpClient(min_delay=0, max_delay=0, max_attempts=2, sleep=no_sleep.append)
    route = respx.get("https://example.test/page").mock(
        side_effect=httpx.ConnectError("nope")
    )
    assert client.get_html("https://example.test/page") is None
    assert route.call_count == 2


@respx.mock
def test_sends_browser_like_headers(client: HttpClient) -> None:
    route = respx.get("https://example.test/page").mock(
        return_value=httpx.Response(200, text="ok")
    )
    client.get_html("https://example.test/page")
    sent = route.calls.last.request
    assert sent.headers["accept-language"].startswith("es-CL")
    assert "Mozilla/5.0" in sent.headers["user-agent"]

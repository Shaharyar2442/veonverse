"""Live OpCo news for the VEONVERSE hub.

Pulls each operating company's latest coverage from Google News' public RSS
search feed. No API key is required. Results are cached in-process so the hub
page does not trigger seven outbound requests on every load.
"""

from __future__ import annotations

import threading
import time
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from email.utils import parsedate_to_datetime

import requests


FEED_URL = "https://news.google.com/rss/search"
REQUEST_TIMEOUT = 12
CACHE_TTL_SECONDS = 30 * 60
# Per OpCo, so one noisy company cannot crowd out the rest.
MAX_PER_OPCO = 3

OPCO_FEEDS = [
    {"id": "veon", "name": "VEON HQ", "place": "Dubai, UAE", "query": "VEON telecom"},
    {"id": "mobilink", "name": "Mobilink Bank", "place": "Pakistan", "query": "Mobilink Microfinance Bank"},
    {"id": "jazzworld", "name": "JazzWorld", "place": "Pakistan", "query": "Jazz Pakistan telecom"},
    {"id": "kyivstar", "name": "Kyivstar", "place": "Ukraine", "query": "Kyivstar"},
    {"id": "banglalink", "name": "Banglalink", "place": "Bangladesh", "query": "Banglalink"},
    {"id": "beeline-kz", "name": "Beeline", "place": "Kazakhstan", "query": "Beeline Kazakhstan"},
    {"id": "beeline-uz", "name": "Beeline", "place": "Uzbekistan", "query": "Beeline Uzbekistan"},
]


_cache_lock = threading.Lock()
_cache: dict = {"fetched_at": 0.0, "stories": []}


def _split_source(title: str) -> tuple[str, str]:
    """Google News formats titles as "Headline - Publisher"."""
    if " - " in title:
        headline, _, source = title.rpartition(" - ")
        return headline.strip(), source.strip()
    return title.strip(), ""


def _published_iso(raw: str | None) -> str | None:
    if not raw:
        return None
    try:
        return parsedate_to_datetime(raw).isoformat()
    except (TypeError, ValueError):
        return None


def _sort_key(story: dict) -> str:
    # Newest first; undated entries sink to the bottom.
    return story.get("published_at") or ""


# Namespaced media tags used by feeds that do carry artwork.
_MEDIA_NS = {"media": "http://search.yahoo.com/mrss/"}


def _image_url(item: ET.Element) -> str | None:
    """Article artwork, when the feed supplies it.

    Google News' search feed carries none, so this returns None there and the UI
    falls back to the operating company's logo. Newsroom feeds often do include
    media tags, and this picks them up without any further change.
    """
    for path in ("media:content", "media:thumbnail"):
        node = item.find(path, _MEDIA_NS)
        if node is not None and node.get("url"):
            return node.get("url")

    enclosure = item.find("enclosure")
    if enclosure is not None and (enclosure.get("type") or "").startswith("image/"):
        return enclosure.get("url")

    return None


def _fetch_opco(opco: dict) -> list[dict]:
    try:
        response = requests.get(
            FEED_URL,
            params={"q": opco["query"], "hl": "en-US", "gl": "US", "ceid": "US:en"},
            headers={"User-Agent": "Mozilla/5.0 (compatible; VEONVERSE/1.0)"},
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        root = ET.fromstring(response.content)
    except (requests.RequestException, ET.ParseError):
        # One unreachable feed must not take the whole section down.
        return []

    stories: list[dict] = []
    for item in root.findall(".//item")[:MAX_PER_OPCO]:
        raw_title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        if not raw_title or not link:
            continue

        headline, source = _split_source(raw_title)
        stories.append(
            {
                "opco_id": opco["id"],
                "opco_name": opco["name"],
                "place": opco["place"],
                "title": headline,
                "source": source,
                "url": link,
                "image_url": _image_url(item),
                "published_at": _published_iso(item.findtext("pubDate")),
            }
        )
    return stories


def _refresh() -> list[dict]:
    with ThreadPoolExecutor(max_workers=len(OPCO_FEEDS)) as pool:
        results = list(pool.map(_fetch_opco, OPCO_FEEDS))

    # Interleave so the first cards show different OpCos rather than three in a row.
    interleaved: list[dict] = []
    for rank in range(MAX_PER_OPCO):
        tier = [batch[rank] for batch in results if len(batch) > rank]
        tier.sort(key=_sort_key, reverse=True)
        interleaved.extend(tier)

    return interleaved


def get_stories(limit: int = 8, force: bool = False) -> dict:
    """Cached list of the latest story per OpCo, newest first."""
    now = time.time()

    with _cache_lock:
        is_stale = force or (now - _cache["fetched_at"]) > CACHE_TTL_SECONDS or not _cache["stories"]

    if is_stale:
        fresh = _refresh()
        if fresh:
            with _cache_lock:
                _cache["stories"] = fresh
                _cache["fetched_at"] = time.time()

    with _cache_lock:
        stories = list(_cache["stories"])
        fetched_at = _cache["fetched_at"]

    return {
        "stories": stories[: max(1, limit)],
        "total": len(stories),
        "fetched_at": fetched_at,
    }

"""US address geocoding for import scripts (offline cache in SQLite after import)."""

from __future__ import annotations

import re
import time
import urllib.parse
import urllib.request
from dataclasses import dataclass
import httpx

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
CENSUS_URL = "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress"
USER_AGENT = "ClinicAccess-Import/1.0 (ClinicAccess backend; contact: local-dev)"


@dataclass
class GeocodeResult:
    latitude: float
    longitude: float
    provider: str
    matched_query: str


@dataclass
class GeocodeFailure:
    site_id: str
    attempts: list[str]
    errors: list[str]


def simplify_street_address(address: str) -> str:
    text = address.strip()
    text = re.sub(r",\s*\d+(?:st|nd|rd|th)?\s+floor\b.*$", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s+\d+(?:st|nd|rd|th)?\s+floor\b.*$", "", text, flags=re.IGNORECASE)
    text = re.sub(r",\s*suite\b.*$", "", text, flags=re.IGNORECASE)
    for pattern, replacement in (
        (r"\s+S\.E\.", " SE"),
        (r"\s+S\.W\.", " SW"),
        (r"\s+N\.E\.", " NE"),
        (r"\s+N\.W\.", " NW"),
        (r"\bDr\.\b", "Drive"),
    ):
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    return text.strip(" ,")


def expand_street_aliases(street: str) -> list[str]:
    """Generate alternate street lines (e.g. MLK -> Martin Luther King Jr)."""
    variants: list[str] = [street]
    if re.search(r"\bMLK\b", street, flags=re.IGNORECASE):
        variants.append(re.sub(r"\bMLK\b", "Martin Luther King Jr", street, flags=re.IGNORECASE))
        variants.append(re.sub(r"\bMLK\s+Jr\.?\b", "Martin Luther King Jr", street, flags=re.IGNORECASE))
    if re.search(r"\bMartin Luther King\b", street, flags=re.IGNORECASE) and not re.search(
        r"\bJr\b", street, flags=re.IGNORECASE
    ):
        variants.append(re.sub(r"\bMartin Luther King\b", "Martin Luther King Jr", street, flags=re.IGNORECASE))
    if " Parkway" in street:
        variants.append(street.replace(" Parkway", " Pkwy"))
    if " Pkwy" in street:
        variants.append(street.replace(" Pkwy", " Parkway"))
    if " Metropolitan Pkwy" in street:
        variants.append(street.replace(" Metropolitan Pkwy", " Metropolitan Parkway"))
    return list(dict.fromkeys(v.strip() for v in variants if v.strip()))


def build_oneline_addresses(
    address: str,
    city: str,
    state: str,
    postal_code: str,
) -> list[str]:
    streets: list[str] = []
    for base in (simplify_street_address(address), address.strip()):
        streets.extend(expand_street_aliases(base))
    streets = list(dict.fromkeys(streets))

    lines: list[str] = []
    for street in streets:
        lines.append(f"{street}, {city}, {state} {postal_code}")
        lines.append(f"{street}, {city}, {state}")
    return list(dict.fromkeys(lines))


def geocode_us_census(oneline: str) -> GeocodeResult | None:
    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.get(
                CENSUS_URL,
                params={"address": oneline, "benchmark": "Public_AR_Current", "format": "json"},
            )
            response.raise_for_status()
            payload = response.json()
        matches = payload.get("result", {}).get("addressMatches", [])
        if not matches:
            return None
        coordinates = matches[0].get("coordinates") or {}
        lat = coordinates.get("y")
        lon = coordinates.get("x")
        if lat is None or lon is None:
            return None
        return GeocodeResult(float(lat), float(lon), "derived_geocode_census", oneline)
    except (httpx.HTTPError, ValueError, TypeError, KeyError):
        return None


def geocode_nominatim(oneline: str) -> GeocodeResult | None:
    query = urllib.parse.urlencode({"q": oneline, "format": "json", "limit": 1})
    request = urllib.request.Request(f"{NOMINATIM_URL}?{query}", headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            payload = json_loads(response.read().decode("utf-8"))
        if not payload:
            return None
        lat = float(payload[0]["lat"])
        lon = float(payload[0]["lon"])
        time.sleep(1.1)
        return GeocodeResult(lat, lon, "derived_geocode_osm", oneline)
    except (OSError, ValueError, TypeError, KeyError, IndexError):
        return None


def json_loads(text: str):
    import json

    return json.loads(text)


def resolve_us_address(
    site_id: str,
    address: str,
    city: str,
    state: str,
    postal_code: str,
    latitude: float | None = None,
    longitude: float | None = None,
) -> GeocodeResult:
    if latitude is not None and longitude is not None:
        return GeocodeResult(float(latitude), float(longitude), "provided_in_curated_json", "curated-json")

    attempts = build_oneline_addresses(address, city, state, postal_code)
    errors: list[str] = []

    for oneline in attempts:
        census = geocode_us_census(oneline)
        if census:
            return census
        errors.append(f"census:no_match:{oneline}")

    for oneline in attempts:
        osm = geocode_nominatim(oneline)
        if osm:
            return osm
        errors.append(f"osm:no_match:{oneline}")

    raise ValueError(
        f"Could not geocode address for {site_id}. Tried {len(attempts)} format(s). "
        f"Sample attempts: {attempts[:4]}. Details: {'; '.join(errors[:6])}"
    )

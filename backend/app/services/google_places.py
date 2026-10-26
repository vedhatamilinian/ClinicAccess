"""Google Places API (New) — text search for ratings and review snippets."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import httpx

SEARCH_TEXT_URL = "https://places.googleapis.com/v1/places:searchText"
SEARCH_FIELD_MASK = "places.id,places.rating,places.userRatingCount,places.reviews,places.googleMapsUri"
DETAILS_FIELD_MASK = "id,rating,userRatingCount,reviews,googleMapsUri"


def place_id_for_details_api(place_id: str | None) -> str | None:
    """Places Details (New) expects the id segment only, not ``places/...``."""
    if not place_id:
        return None
    if place_id.startswith("places/"):
        return place_id.removeprefix("places/")
    return place_id


def clinic_search_query(name: str, address: str, city: str, state: str, postal_code: str) -> str:
    return f"{name}, {address}, {city}, {state} {postal_code}".strip()


def _review_items_from_place(place: dict[str, Any]) -> list[dict[str, Any]]:
    reviews: list[dict[str, Any]] = []
    for item in place.get("reviews") or []:
        if "author_name" in item:
            reviews.append(
                {
                    "author_name": item.get("author_name") or "Google user",
                    "rating": int(item.get("rating") or 0),
                    "text": (item.get("text") or "").strip(),
                    "relative_time_description": item.get("relative_time_description"),
                }
            )
            continue
        author = (item.get("authorAttribution") or {}).get("displayName") or "Google user"
        text_field = item.get("text")
        if isinstance(text_field, dict):
            text = (text_field.get("text") or "").strip()
        else:
            text = str(text_field or "").strip()
        reviews.append(
            {
                "author_name": author,
                "rating": int(item.get("rating") or 0),
                "text": text,
                "relative_time_description": item.get("relativePublishTimeDescription"),
            }
        )
    return reviews


def google_reviews_from_place(place: dict[str, Any]) -> dict[str, Any]:
    """Normalize legacy Details `result` or Places API (New) `places[]` item."""
    place_id = place.get("place_id") or place.get("id")
    rating = place.get("rating")
    user_rating_count = place.get("user_ratings_total")
    if user_rating_count is None:
        user_rating_count = place.get("userRatingCount")
    maps_url = place.get("url") or place.get("googleMapsUri")
    reviews = _review_items_from_place(place)[:5]
    payload: dict[str, Any] = {
        "source": "google",
        "place_id": place_id,
        "rating": rating,
        "user_rating_count": user_rating_count,
        "maps_url": maps_url,
        "reviews": reviews,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }
    if reviews:
        payload["review_snippets_source"] = "google"
    return payload


# Backward-compatible alias for tests
def google_reviews_from_details(details: dict[str, Any]) -> dict[str, Any]:
    return google_reviews_from_place(details)


def search_place_by_text(text_query: str, api_key: str, client: httpx.Client | None = None) -> dict[str, Any] | None:
    http = client or httpx.Client(timeout=20.0)
    close_client = client is None
    try:
        response = http.post(
            SEARCH_TEXT_URL,
            headers={
                "Content-Type": "application/json",
                "X-Goog-Api-Key": api_key,
                "X-Goog-FieldMask": SEARCH_FIELD_MASK,
            },
            json={"textQuery": text_query},
        )
        response.raise_for_status()
        payload = response.json()
        places = payload.get("places") or []
        if not places:
            return None
        return places[0]
    except httpx.HTTPStatusError as exc:
        detail = ""
        try:
            body = exc.response.json()
            detail = body.get("error", {}).get("message") or str(body)
        except Exception:  # noqa: BLE001
            detail = exc.response.text
        raise RuntimeError(f"Places search failed: {detail}".strip()) from exc
    finally:
        if close_client:
            http.close()


def fetch_place_details(
    place_id: str,
    api_key: str,
    client: httpx.Client | None = None,
) -> dict[str, Any] | None:
    """Place Details (New) — may return ``reviews`` when Enterprise + Atmosphere is enabled."""
    resource_id = place_id_for_details_api(place_id)
    if not resource_id:
        return None
    http = client or httpx.Client(timeout=20.0)
    close_client = client is None
    try:
        response = http.get(
            f"https://places.googleapis.com/v1/places/{resource_id}",
            headers={
                "X-Goog-Api-Key": api_key,
                "X-Goog-FieldMask": DETAILS_FIELD_MASK,
            },
        )
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 404:
            return None
        detail = ""
        try:
            body = exc.response.json()
            detail = body.get("error", {}).get("message") or str(body)
        except Exception:  # noqa: BLE001
            detail = exc.response.text
        raise RuntimeError(f"Place details failed: {detail}".strip()) from exc
    finally:
        if close_client:
            http.close()


def is_places_quota_error(message: str) -> bool:
    lowered = message.lower()
    return "quota exceeded" in lowered or "resource_exhausted" in lowered


def fetch_google_reviews_for_place_id(
    place_id: str,
    api_key: str,
    client: httpx.Client | None = None,
) -> dict[str, Any] | None:
    """Refresh ratings/snippets from Place Details only (does not use Text Search quota)."""
    details = fetch_place_details(place_id, api_key, client=client)
    if not details:
        return None
    merged = dict(details)
    if place_id and not merged.get("id"):
        merged["id"] = place_id
    return google_reviews_from_place(merged)


def fetch_google_reviews_for_query(text_query: str, api_key: str, client: httpx.Client | None = None) -> dict[str, Any] | None:
    place = search_place_by_text(text_query, api_key, client=client)
    if not place:
        return None
    if not (place.get("reviews") or []):
        pid = place.get("id") or place.get("place_id")
        if pid:
            details = fetch_place_details(pid, api_key, client=client)
            if details:
                if details.get("reviews"):
                    place = {**place, "reviews": details["reviews"]}
                for key in ("rating", "userRatingCount", "googleMapsUri"):
                    if details.get(key) is not None:
                        place[key] = details[key]
    return google_reviews_from_place(place)

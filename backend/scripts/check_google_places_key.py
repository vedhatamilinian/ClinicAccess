"""Verify GOOGLE_MAPS_API_KEY: ratings vs review snippet access (Places API New)."""

from __future__ import annotations

import sys
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.config import get_settings  # noqa: E402
from app.services.google_places import (  # noqa: E402
    DETAILS_FIELD_MASK,
    SEARCH_FIELD_MASK,
    SEARCH_TEXT_URL,
    clinic_search_query,
    fetch_google_reviews_for_query,
)

SAMPLE_QUERY = clinic_search_query(
    "10 Park Place Health Center",
    "10 Park Place NE",
    "Atlanta",
    "GA",
    "30309",
)


def main() -> None:
    settings = get_settings()
    key = settings.google_maps_api_key.strip()
    if not key:
        print("FAIL: Set GOOGLE_MAPS_API_KEY in backend/.env")
        sys.exit(1)

    print("Checking Places API (New) with a Fulton BOH sample clinic...")
    print(f"  Query: {SAMPLE_QUERY}")

    with httpx.Client(timeout=25.0) as client:
        search = client.post(
            SEARCH_TEXT_URL,
            headers={
                "Content-Type": "application/json",
                "X-Goog-Api-Key": key,
                "X-Goog-FieldMask": SEARCH_FIELD_MASK,
            },
            json={"textQuery": SAMPLE_QUERY},
        )
        if search.status_code != 200:
            print(f"FAIL: Text Search HTTP {search.status_code}")
            print(search.text[:400])
            sys.exit(1)

        places = search.json().get("places") or []
        if not places:
            print("FAIL: Text Search returned no places (check API key restrictions or query).")
            sys.exit(1)

        place = places[0]
        pid = place.get("id")
        rating = place.get("rating")
        count = place.get("userRatingCount")
        search_reviews = place.get("reviews")
        print(f"OK: Text Search — place id {pid}, rating {rating}, userRatingCount {count}")
        print(f"    reviews in search response: {len(search_reviews or []) if search_reviews is not None else 'field omitted'}")

        if pid:
            details = client.get(
                f"https://places.googleapis.com/v1/places/{pid}",
                headers={
                    "X-Goog-Api-Key": key,
                    "X-Goog-FieldMask": DETAILS_FIELD_MASK,
                },
            )
            if details.status_code != 200:
                print(f"FAIL: Place Details HTTP {details.status_code}")
                print(details.text[:400])
                sys.exit(1)
            body = details.json()
            detail_reviews = body.get("reviews")
            print(
                f"    Place Details reviews: "
                f"{len(detail_reviews or []) if detail_reviews is not None else 'field omitted'}"
            )

        payload = fetch_google_reviews_for_query(SAMPLE_QUERY, key, client=client)

    snippets = len((payload or {}).get("reviews") or [])
    print(f"OK: enrich pipeline would store {snippets} review snippet(s).")

    if snippets == 0:
        print()
        print("Ratings work, but review TEXT is not returned. On Google Cloud Console:")
        print("  1. APIs & Services → Enable **Places API (New)** (you likely have this).")
        print("  2. Billing → link a billing account to the project.")
        print("  3. The `reviews` field needs **Place Details Enterprise + Atmosphere** SKU.")
        print("     See: https://developers.google.com/maps/documentation/places/web-service/data-fields")
        print("  4. Re-run: python scripts/check_google_places_key.py")
        print("  5. Then: python scripts/enrich_google_reviews.py --force")
        sys.exit(2)

    print("Review snippets are available — run enrich_google_reviews.py --force to refresh the database.")


if __name__ == "__main__":
    main()

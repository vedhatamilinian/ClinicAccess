"""Fetch Google ratings and review snippets for clinics and store them on each record."""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from sqlalchemy import select

from app.config import get_settings  # noqa: E402
from app.database import SessionLocal, init_db  # noqa: E402
from app.models import Clinic  # noqa: E402
from app.services.google_places import (  # noqa: E402
    clinic_search_query,
    fetch_google_reviews_for_place_id,
    fetch_google_reviews_for_query,
    is_places_quota_error,
)


def _enrichment_fully_cached(existing: dict[str, object]) -> bool:
    """Skip re-fetch only when real Google review snippets are already cached."""
    if not existing.get("place_id"):
        return False
    n_rev = len(existing.get("reviews") or [])
    if existing.get("review_snippets_source") == "google" and n_rev > 0:
        return True
    return False


def _merge_payload_preserving_illustrative(existing: dict[str, object], payload: dict[str, object]) -> dict[str, object]:
    n_new = len(payload.get("reviews") or [])
    if n_new > 0:
        return payload
    if existing.get("review_snippets_source") != "illustrative_demo":
        return payload
    if not existing.get("reviews"):
        return payload
    merged = dict(payload)
    merged["reviews"] = existing["reviews"]
    merged["review_snippets_source"] = "illustrative_demo"
    if existing.get("snippets_filled_at"):
        merged["snippets_filled_at"] = existing["snippets_filled_at"]
    return merged


def main() -> None:
    parser = argparse.ArgumentParser(description="Enrich clinics with Google Places ratings and reviews.")
    parser.add_argument("--include-demo", action="store_true", help="Include synthetic_demo clinics.")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-fetch all clinics (replaces illustrative demo snippets when Google returns real review text).",
    )
    parser.add_argument("--limit", type=int, default=0, help="Max clinics to process (0 = all).")
    parser.add_argument(
        "--search",
        action="store_true",
        help="Always use Text Search (uses SearchTextRequest daily quota). Default: Place Details when place_id exists.",
    )
    parser.add_argument("--delay", type=float, default=0.35, help="Seconds between API calls.")
    args = parser.parse_args()

    settings = get_settings()
    if not settings.google_maps_api_key.strip():
        print("Set GOOGLE_MAPS_API_KEY in backend/.env (Places API enabled).")
        sys.exit(1)

    init_db()
    db = SessionLocal()
    statement = select(Clinic).where(Clinic.record_status == "active")
    if not args.include_demo:
        statement = statement.where(Clinic.data_source.in_(["hrsa_hcsd", "fulton_boh"]))
    statement = statement.order_by(Clinic.name)
    clinics = list(db.scalars(statement).all())
    if args.limit > 0:
        clinics = clinics[: args.limit]

    updated = 0
    skipped = 0
    failed = 0

    with httpx.Client(timeout=20.0) as client:
        for clinic in clinics:
            existing = clinic.google_reviews or {}
            if not args.force and _enrichment_fully_cached(existing):
                n_rev = len(existing.get("reviews") or [])
                source = existing.get("review_snippets_source") or "unknown"
                print(
                    f"SKIP {clinic.id}: already complete (rating={existing.get('rating')}, "
                    f"snippets={n_rev}, source={source})"
                )
                skipped += 1
                continue
            if not args.force and existing.get("place_id") and not _enrichment_fully_cached(existing):
                source = existing.get("review_snippets_source") or "none"
                n_rev = len(existing.get("reviews") or [])
                if source == "illustrative_demo" and n_rev > 0:
                    print(
                        f"UPGRADE {clinic.id}: demo snippets cached — calling Google Places "
                        f"(rating={existing.get('rating')}); real snippets replace demo when API returns them"
                    )
                else:
                    print(
                        f"REFETCH {clinic.id}: no Google review text yet — trying Places API "
                        f"(rating={existing.get('rating')})"
                    )
            place_id = existing.get("place_id")
            use_details_only = bool(place_id) and not args.search
            try:
                if use_details_only:
                    payload = fetch_google_reviews_for_place_id(
                        str(place_id), settings.google_maps_api_key, client=client
                    )
                else:
                    query = clinic_search_query(
                        clinic.name, clinic.address, clinic.city, clinic.state, clinic.postal_code
                    )
                    payload = fetch_google_reviews_for_query(query, settings.google_maps_api_key, client=client)
            except Exception as exc:  # noqa: BLE001
                msg = str(exc)
                print(f"FAIL {clinic.id}: {msg}")
                failed += 1
                if is_places_quota_error(msg):
                    print(
                        "\nStopped: daily Places API quota hit. Wait until quota resets (midnight Pacific) "
                        "or request a higher limit in Google Cloud Console → APIs → Places API (New) → Quotas.\n"
                        "Re-run without --search to use cached place_id + Place Details only (saves Text Search quota)."
                    )
                    break
                time.sleep(args.delay)
                continue
            if not payload:
                print(f"SKIP {clinic.id}: no Google place match for query")
                skipped += 1
                time.sleep(args.delay)
                continue
            clinic.google_reviews = _merge_payload_preserving_illustrative(existing, payload)
            verification = dict(clinic.field_verification or {})
            verification["google_reviews"] = "google_places_api"
            clinic.field_verification = verification
            db.add(clinic)
            db.commit()
            updated += 1
            rating = payload.get("rating")
            count = payload.get("user_rating_count")
            n_rev = len(payload.get("reviews") or [])
            print(f"OK {clinic.id}: {rating} ({count} ratings), review_snippets={n_rev}")
            if n_rev == 0 and count:
                print(
                    "  Note: Google returned no review text. Places API (New) often requires "
                    "Place Details (Enterprise + Atmosphere) on your Cloud project for snippets."
                )
            time.sleep(args.delay)

    db.close()
    print(f"Done. updated={updated} skipped={skipped} failed={failed}")
    if skipped and updated == 0:
        print(
            "Tip: skipped = real Google review snippets already cached. "
            "Use --force to refresh ratings/snippets anyway."
        )


if __name__ == "__main__":
    main()

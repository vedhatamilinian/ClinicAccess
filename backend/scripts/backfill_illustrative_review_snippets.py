"""Add labeled demo review snippets when Google ratings exist but review text was not returned."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from sqlalchemy import select

from app.database import SessionLocal, init_db  # noqa: E402
from app.models import Clinic  # noqa: E402
from app.services.review_snippets_demo import merge_illustrative_snippets  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Backfill illustrative review snippets (not real Google text) for demo/presentation."
    )
    parser.add_argument("--include-demo", action="store_true", help="Include synthetic_demo clinics.")
    parser.add_argument("--force", action="store_true", help="Replace existing illustrative snippets.")
    parser.add_argument("--limit", type=int, default=0, help="Max clinics (0 = all eligible).")
    args = parser.parse_args()

    init_db()
    db = SessionLocal()
    statement = select(Clinic).where(Clinic.record_status == "active")
    if not args.include_demo:
        statement = statement.where(Clinic.data_source.in_(["hrsa_hcsd", "fulton_boh"]))
    statement = statement.order_by(Clinic.name)
    clinics = list(db.scalars(statement).all())

    updated = 0
    skipped = 0

    for clinic in clinics:
        gr = clinic.google_reviews or {}
        has_rating = gr.get("rating") is not None or gr.get("place_id")
        if not has_rating:
            skipped += 1
            continue
        if gr.get("reviews") and gr.get("review_snippets_source") != "illustrative_demo":
            skipped += 1
            continue
        if gr.get("review_snippets_source") == "illustrative_demo" and not args.force:
            skipped += 1
            continue
        if args.limit > 0 and updated >= args.limit:
            break

        clinic.google_reviews = merge_illustrative_snippets(gr, clinic.name)
        verification = dict(clinic.field_verification or {})
        verification["google_reviews"] = "illustrative_demo_snippets"
        clinic.field_verification = verification
        db.add(clinic)
        db.commit()
        updated += 1
        print(f"OK {clinic.id}: added {len(clinic.google_reviews.get('reviews') or [])} illustrative snippets")

    db.close()
    print(f"Done. updated={updated} skipped={skipped}")


if __name__ == "__main__":
    main()

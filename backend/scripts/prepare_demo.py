#!/usr/bin/env python3
"""Verify backend data and services before a live ClinicAccess demo."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from sqlalchemy import func, select

from app.database import SessionLocal, init_db
from app.models import Clinic, CommunityResource


def main() -> None:
    init_db()
    db = SessionLocal()
    try:
        clinics = list(
            db.scalars(
                select(Clinic).where(
                    Clinic.record_status == "active",
                    Clinic.data_source.in_(["hrsa_hcsd", "fulton_boh"]),
                )
            ).all()
        )
        resources = db.scalar(select(func.count()).select_from(CommunityResource)) or 0
    finally:
        db.close()

    hours_count = sum(1 for c in clinics if (c.operating_hours or {}).get("summary"))
    with_rating = sum(1 for c in clinics if (c.google_reviews or {}).get("rating") is not None)

    print("ClinicAccess — demo environment check")
    print(f"  Active HRSA + Fulton BOH clinics: {len(clinics)}")
    print(f"  Clinics with hours summary: {hours_count}")
    print(f"  Clinics with cached Google rating: {with_rating}")
    print(f"  Community resources: {resources}")

    if len(clinics) < 5:
        print("\n⚠ Few clinics found. Run imports:")
        print("  python scripts/import_hrsa_fulton.py")
        print("  python scripts/import_boh_fulton.py")
        sys.exit(1)

    print("\nStart API for the phone app:")
    print("  uvicorn app.main:app --host 0.0.0.0 --port 8000")
    print("\nIn project root .env set EXPO_PUBLIC_API_BASE_URL=http://<LAN-IP>:8000")
    print("\nSee docs/DEMO.md for the full presentation script.")


if __name__ == "__main__":
    main()

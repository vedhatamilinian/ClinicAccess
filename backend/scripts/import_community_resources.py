"""Import curated Fulton community resources from JSON."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.database import SessionLocal, init_db  # noqa: E402
from app.models import CommunityResource  # noqa: E402

DEFAULT_JSON = ROOT / "data" / "fulton_community_resources.json"


def payload_from_record(record: dict, verified_on: str) -> dict:
    verified_at = datetime.fromisoformat(f"{verified_on}T00:00:00+00:00")
    return {
        "id": record["id"],
        "name": record["name"],
        "category": record["category"],
        "description": record.get("description", ""),
        "organization_name": record.get("organization_name", ""),
        "address": record.get("address", ""),
        "city": record.get("city", "Atlanta"),
        "state": record.get("state", "GA"),
        "zip_code": record.get("zip_code", ""),
        "latitude": record.get("latitude"),
        "longitude": record.get("longitude"),
        "phone": record.get("phone", ""),
        "website": record.get("website"),
        "hours": record.get("hours", ""),
        "services_offered": record.get("services_offered", []),
        "eligibility_requirements": record.get("eligibility_requirements", ""),
        "cost_information": record.get("cost_information", ""),
        "languages_supported": record.get("languages_supported", []),
        "accessibility_information": record.get("accessibility_information", ""),
        "appointment_required": record.get("appointment_required"),
        "service_area": record.get("service_area", ""),
        "source_name": record.get("source_name", ""),
        "source_url": record.get("source_url"),
        "verification_status": record.get("verification_status", "verified_authoritative"),
        "record_status": "active",
        "last_verified_at": verified_at,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", type=Path, default=DEFAULT_JSON)
    args = parser.parse_args()
    path = args.json.expanduser().resolve()
    if not path.is_file():
        print(f"Missing file: {path}", file=sys.stderr)
        sys.exit(1)

    document = json.loads(path.read_text(encoding="utf-8"))
    verified_on = document.get("source_verified_on", datetime.now(timezone.utc).date().isoformat())
    records = document.get("resources", [])

    init_db()
    db = SessionLocal()
    added = updated = 0
    try:
        for record in records:
            payload = payload_from_record(record, verified_on)
            existing = db.get(CommunityResource, payload["id"])
            if existing:
                for key, value in payload.items():
                    setattr(existing, key, value)
                updated += 1
            else:
                db.add(CommunityResource(**payload))
                added += 1
        db.commit()
        print(f"Community resources import: {added} added, {updated} updated ({len(records)} in file).")
    finally:
        db.close()


if __name__ == "__main__":
    main()

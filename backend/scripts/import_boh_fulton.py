"""Import Fulton County Board of Health sites from curated JSON."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.database import SessionLocal, init_db  # noqa: E402
from app.importers.boh import load_boh_payloads  # noqa: E402
from app.models import Clinic, ClinicFieldProvenance  # noqa: E402
from app.services.clinic_quality import compute_completeness  # noqa: E402

DEFAULT_JSON = ROOT / "data" / "fulton_boh_sites.json"

# Structured blobs stored inside field_verification JSON — not string provenance levels.
_PROVENANCE_SKIP_FIELDS = frozenset({"affordability_structured", "appointment_structured"})


def upsert_payloads(db, payloads: list[dict]) -> int:
    count = 0
    for payload in payloads:
        clinic = db.get(Clinic, payload["id"])
        if clinic:
            for key, value in payload.items():
                setattr(clinic, key, value)
        else:
            clinic = Clinic(**payload)
            db.add(clinic)
        db.flush()
        clinic.data_completeness_score = compute_completeness(clinic)
        verification = payload.get("field_verification") or {}
        for field_name, verification_level in verification.items():
            if field_name in _PROVENANCE_SKIP_FIELDS or not isinstance(verification_level, str):
                continue
            db.add(
                ClinicFieldProvenance(
                    clinic_id=clinic.id,
                    field_name=field_name,
                    verification=verification_level,
                    source_code="fulton_boh",
                    source_url=payload.get("website"),
                )
            )
        count += 1
    return count


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", type=Path, default=DEFAULT_JSON)
    args = parser.parse_args()
    json_path = args.json.expanduser().resolve()
    if not json_path.is_file():
        print(f"Missing curated file: {json_path}", file=sys.stderr)
        sys.exit(1)

    init_db()
    db = SessionLocal()
    try:
        payloads, skipped = load_boh_payloads(json_path, set())
        count = upsert_payloads(db, payloads)
        db.commit()
        print(f"Fulton BOH import complete: {count} site(s) upserted.")
        if skipped:
            print("Skipped duplicates:", ", ".join(skipped))
    finally:
        db.close()


if __name__ == "__main__":
    main()

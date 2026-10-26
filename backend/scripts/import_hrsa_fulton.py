"""Import Fulton County, GA HRSA health center sites from a local CSV export."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.database import SessionLocal, init_db  # noqa: E402
from app.importers.hrsa import iter_fulton_clinic_payloads  # noqa: E402
from app.models import Clinic  # noqa: E402

DEFAULT_CSV = ROOT / "data" / "hrsa_service_delivery_sites.csv"


def upsert_clinics(payloads: list[dict]) -> int:
    init_db()
    db = SessionLocal()
    try:
        for payload in payloads:
            clinic = db.get(Clinic, payload["id"])
            if clinic:
                for key, value in payload.items():
                    setattr(clinic, key, value)
            else:
                db.add(Clinic(**payload))
        db.commit()
        return len(payloads)
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--csv",
        type=Path,
        default=DEFAULT_CSV,
        help=f"Path to HRSA Service Delivery Sites CSV (default: {DEFAULT_CSV})",
    )
    args = parser.parse_args()
    csv_path = args.csv.expanduser().resolve()
    if not csv_path.is_file():
        print(
            f"CSV not found: {csv_path}\n"
            "Download from https://data.hrsa.gov/data/download "
            "(Health Center Service Delivery and Look-Alike Sites → CSV) "
            f"and save as {DEFAULT_CSV}",
            file=sys.stderr,
        )
        sys.exit(1)

    payloads, stats = iter_fulton_clinic_payloads(csv_path)
    upsert_clinics(payloads)
    print(
        f"HRSA import complete: {stats.imported} Fulton County site(s) upserted "
        f"({stats.rows_read} CSV rows read, {stats.fulton_rows} Fulton rows matched, {stats.skipped} skipped)."
    )


if __name__ == "__main__":
    main()

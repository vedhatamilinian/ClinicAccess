"""Parse HRSA Health Center Service Delivery and Look-Alike Sites CSV exports."""

from __future__ import annotations

import csv
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

from app.importers.hrsa_constants import HRSA_FQHC_INSURANCE_NOTE, HRSA_FQHC_TYPICAL_INSURANCE
from app.importers.affordability_enrichment import enrich_payload_affordability
from app.importers.transit_enrichment import enrich_payload_transit

# Physical column names from HRSA metadata (data.hrsa.gov). User-friendly headers are also accepted.
COLUMN_ALIASES: dict[str, tuple[str, ...]] = {
    "bhcmisid": ("BHCMISID", "BHCMIS Organization Identification Number"),
    "bphc_site_num": ("BPHC_SITE_NUM", "BPHC Assigned Number"),
    "hcp_org_nm": ("HCP_ORG_NM", "Health Center Name"),
    "site_nm": ("SITE_NM", "Site Name"),
    "site_address": ("SITE_ADDRESS", "Site Address"),
    "site_city": ("SITE_CITY", "Site City"),
    "site_state": ("SITE_STATE_ABBR", "Site State Abbreviation"),
    "site_zip": ("SITE_ZIP_CD", "Site Postal Code"),
    "site_phone": ("SITE_PHONE_NUM", "Site Telephone Number"),
    "site_url": ("SITE_URL", "Site Web Address"),
    "county_nm": ("COUNTY_NM", "County Equivalent Name", "Complete County Name", "LIST_BOX_COUNTY_NM"),
    "site_status": ("HCC_STATUS_DESC", "Site Status Description"),
    "longitude": ("X", "Geocoding Artifact Address Primary X Coordinate"),
    "latitude": ("Y", "Geocoding Artifact Address Primary Y Coordinate"),
    "hcp_org_typ": ("HCP_ORG_TYP", "Health Center Type"),
}


def _normalize_header(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", value.strip().lower()).strip("_")


def _build_header_map(fieldnames: Iterable[str]) -> dict[str, str]:
    """Map canonical keys to actual CSV header names."""
    normalized_to_actual = {_normalize_header(name): name for name in fieldnames}
    header_map: dict[str, str] = {}
    for canonical, candidates in COLUMN_ALIASES.items():
        for candidate in candidates:
            key = _normalize_header(candidate)
            if key in normalized_to_actual:
                header_map[canonical] = normalized_to_actual[key]
                break
    return header_map


def _cell(row: dict[str, str], header_map: dict[str, str], key: str) -> str:
    header = header_map.get(key)
    if not header:
        return ""
    return (row.get(header) or "").strip()


def _slugify_id(*parts: str) -> str:
    raw = "-".join(part for part in parts if part)
    slug = re.sub(r"[^a-z0-9]+", "-", raw.lower()).strip("-")
    return slug[:64] or "hrsa-site"


@dataclass
class HrsaImportStats:
    rows_read: int = 0
    fulton_rows: int = 0
    imported: int = 0
    skipped: int = 0
    skipped_reasons: dict[str, int] = None  # type: ignore[assignment]

    def __post_init__(self) -> None:
        if self.skipped_reasons is None:
            self.skipped_reasons = {}


# HRSA sites in Fulton County plus Gwinnett and Forsyth (Georgia congressional district 7).
_SERVICE_AREA_COUNTY_TOKENS = ("fulton", "gwinnett", "forsyth")


def is_service_area_row(row: dict[str, str], header_map: dict[str, str]) -> bool:
    state = _cell(row, header_map, "site_state").upper()
    if state != "GA":
        return False
    county = _cell(row, header_map, "county_nm").lower()
    return any(token in county for token in _SERVICE_AREA_COUNTY_TOKENS)


def is_fulton_county_row(row: dict[str, str], header_map: dict[str, str]) -> bool:
    """Backward-compatible alias for tests and scripts."""
    return is_service_area_row(row, header_map)


def row_to_clinic_payload(row: dict[str, str], header_map: dict[str, str], imported_at: datetime) -> dict[str, Any] | None:
    status = _cell(row, header_map, "site_status").lower()
    if status and status not in {"active", "open"} and "active" not in status:
        return None

    address = _cell(row, header_map, "site_address")
    city = _cell(row, header_map, "site_city")
    if not address or not city:
        return None

    site_name = _cell(row, header_map, "site_nm") or _cell(row, header_map, "hcp_org_nm")
    if not site_name:
        return None

    try:
        latitude = float(_cell(row, header_map, "latitude"))
        longitude = float(_cell(row, header_map, "longitude"))
    except ValueError:
        return None

    bhcmis = _cell(row, header_map, "bhcmisid")
    site_num = _cell(row, header_map, "bphc_site_num")
    clinic_id = _slugify_id("hrsa", bhcmis, site_num)

    org_name = _cell(row, header_map, "hcp_org_nm")
    org_type = _cell(row, header_map, "hcp_org_typ")
    description_parts = [
        f"HRSA Health Center Program delivery site in Georgia (Fulton County and congressional district 7).",
    ]
    if org_name and org_name != site_name:
        description_parts.append(f"Organization: {org_name}.")
    if org_type:
        description_parts.append(f"Program type: {org_type}.")
    description_parts.append("Imported from HRSA Service Delivery and Look-Alike Sites data.")

    website = _cell(row, header_map, "site_url") or None
    if website and not website.startswith(("http://", "https://")):
        website = f"https://{website}"

    org_type_lower = org_type.lower()
    if "look-alike" in org_type_lower or "look alike" in org_type_lower:
        facility_type = "fqhc_lookalike"
    elif org_type:
        facility_type = "fqhc"
    else:
        facility_type = "fqhc"

    description_parts.append(HRSA_FQHC_INSURANCE_NOTE)

    payload = {
        "id": clinic_id,
        "name": site_name,
        "organization_name": org_name or site_name,
        "description": " ".join(description_parts),
        "address": address,
        "city": city,
        "state": _cell(row, header_map, "site_state").upper() or "GA",
        "postal_code": _cell(row, header_map, "site_zip"),
        "latitude": latitude,
        "longitude": longitude,
        "phone": _cell(row, header_map, "site_phone"),
        "website": website,
        "medical_services": [],
        "accepted_insurance": list(HRSA_FQHC_TYPICAL_INSURANCE),
        "languages": [],
        "accessibility_features": [],
        "transit_options": [],
        "operating_hours": {},
        "appointment_information": "Contact the site for appointment and hours information.",
        "data_source": "hrsa_hcsd",
        "facility_type": facility_type,
        "record_status": "active",
        "field_verification": {
            "name": "verified_authoritative",
            "address": "verified_authoritative",
            "phone": "verified_authoritative",
            "latitude": "verified_authoritative",
            "longitude": "verified_authoritative",
            "accepted_insurance": "inferred_hrsa_program",
        },
        "last_verified_at": imported_at,
    }
    enrich_payload_affordability(payload)
    enrich_payload_transit(payload)
    return payload


def iter_fulton_clinic_payloads(csv_path: Path) -> tuple[list[dict[str, Any]], HrsaImportStats]:
    imported_at = datetime.now(timezone.utc)
    stats = HrsaImportStats()
    payloads: list[dict[str, Any]] = []

    with csv_path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames:
            raise ValueError(f"No CSV headers found in {csv_path}")
        header_map = _build_header_map(reader.fieldnames)
        required = ("site_address", "site_city", "latitude", "longitude")
        missing = [key for key in required if key not in header_map]
        if missing:
            raise ValueError(
                f"CSV is missing expected HRSA columns: {missing}. "
                "Download 'Health Center Service Delivery and Look-Alike Sites' CSV from https://data.hrsa.gov/data/download"
            )

        for row in reader:
            stats.rows_read += 1
            if not is_service_area_row(row, header_map):
                continue
            stats.fulton_rows += 1
            payload = row_to_clinic_payload(row, header_map, imported_at)
            if payload is None:
                stats.skipped += 1
                stats.skipped_reasons["invalid_or_inactive_row"] = stats.skipped_reasons.get("invalid_or_inactive_row", 0) + 1
                continue
            payloads.append(payload)

    stats.imported = len(payloads)
    return payloads, stats

"""Import Fulton County Board of Health sites from curated JSON."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.importers.boh_constants import (
    BOH_ACCEPTED_INSURANCE,
    BOH_INSURANCE_SOURCE_URL,
    BOH_LANGUAGE_SOURCE_URL,
    BOH_LANGUAGES,
)
from app.importers.geocode import resolve_us_address
from app.importers.affordability_enrichment import enrich_payload_affordability
from app.importers.transit_enrichment import enrich_payload_transit
from app.importers.normalize import address_key


def site_to_clinic_payload(site: dict[str, Any], source_url: str, imported_at: datetime) -> dict[str, Any]:
    city = site["city"]
    state = site["state"]
    postal = site["postal_code"]
    address = site["address"]

    geocoded = resolve_us_address(
        site_id=site["id"],
        address=address,
        city=city,
        state=state,
        postal_code=postal,
        latitude=site.get("latitude"),
        longitude=site.get("longitude"),
    )

    services = site.get("services") or []
    hours_summary = site.get("hours_summary", "")
    coord_verification = geocoded.provider
    accepted_insurance = site.get("accepted_insurance") or BOH_ACCEPTED_INSURANCE
    languages = site.get("languages") or BOH_LANGUAGES

    field_verification = {
        "name": "verified_authoritative",
        "address": "verified_authoritative",
        "phone": "verified_authoritative",
        "medical_services": "verified_authoritative",
        "operating_hours": "verified_authoritative",
        "accepted_insurance": "verified_authoritative",
        "languages": "verified_authoritative",
        "latitude": coord_verification,
        "longitude": coord_verification,
    }

    payload = {
        "id": site["id"],
        "name": site["name"],
        "organization_name": site.get("organization_name", "Fulton County Board of Health"),
        "description": (
            f"Fulton County Board of Health public health location. "
            f"Insurance plans: {BOH_INSURANCE_SOURCE_URL}. "
            f"Language access (interpreter line): {BOH_LANGUAGE_SOURCE_URL}. "
            f"Site list: {source_url}."
        ),
        "address": address,
        "city": city,
        "state": state,
        "postal_code": postal,
        "latitude": geocoded.latitude,
        "longitude": geocoded.longitude,
        "phone": site.get("phone", ""),
        "website": source_url,
        "facility_type": "public_health",
        "medical_services": services,
        "accepted_insurance": accepted_insurance,
        "languages": languages,
        "accessibility_features": [],
        "transit_options": [],
        "operating_hours": {"summary": hours_summary} if hours_summary else {},
        "appointment_information": "Contact the health center for appointments and walk-in availability.",
        "data_source": "fulton_boh",
        "record_status": "active",
        "field_verification": field_verification,
        "last_verified_at": imported_at,
    }
    enrich_payload_affordability(payload)
    enrich_payload_transit(payload)
    return payload


def load_boh_payloads(json_path: Path, existing_address_keys: set[str]) -> tuple[list[dict[str, Any]], list[str]]:
    imported_at = datetime.now(timezone.utc)
    document = json.loads(json_path.read_text(encoding="utf-8"))
    source_url = document.get("source_url", "https://fultoncountyboh.com/locations/")
    skipped: list[str] = []
    payloads: list[dict[str, Any]] = []

    for site in document.get("sites", []):
        key = address_key(site["address"], site["postal_code"])
        if key in existing_address_keys:
            skipped.append(f"duplicate_address:{site['id']}")
            continue
        payload = site_to_clinic_payload(site, source_url, imported_at)
        existing_address_keys.add(key)
        payloads.append(payload)

    return payloads, skipped

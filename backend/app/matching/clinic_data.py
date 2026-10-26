"""Read clinic fields with verification awareness."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.models import Clinic

INFERRED_VERIFICATION = frozenset(
    {
        "inferred_hrsa_program",
        "derived_marta_proximity",
        "marta_gtfs",
        "derived_geocode",
    }
)


def field_verification(clinic: Clinic, field: str) -> str | None:
    fv = clinic.field_verification or {}
    value = fv.get(field)
    return str(value) if value else None


def is_verified_positive(clinic: Clinic, field: str) -> bool:
    status = field_verification(clinic, field)
    if not status:
        return False
    return status not in INFERRED_VERIFICATION and status != "unknown"


def is_inferred(clinic: Clinic, field: str) -> bool:
    status = field_verification(clinic, field)
    return status in INFERRED_VERIFICATION if status else False


def affordability_blob(clinic: Clinic) -> dict[str, Any]:
    """Optional structured affordability; may be empty until imports populate it."""
    extra = clinic.field_verification or {}
    blob = extra.get("affordability_structured")
    return blob if isinstance(blob, dict) else {}


def appointment_blob(clinic: Clinic) -> dict[str, Any]:
    extra = clinic.field_verification or {}
    blob = extra.get("appointment_structured")
    if isinstance(blob, dict):
        return blob
    return {}


def has_feature(clinic: Clinic, feature: str) -> bool:
    return feature in (clinic.accessibility_features or [])


def accessibility_feature_known(clinic: Clinic) -> bool:
    return bool(clinic.accessibility_features)


def insurance_list(clinic: Clinic) -> list[str]:
    return list(clinic.accepted_insurance or [])


def language_list(clinic: Clinic) -> list[str]:
    return list(clinic.languages or [])


def services_list(clinic: Clinic) -> list[str]:
    return list(clinic.medical_services or [])


def days_since_verified(clinic: Clinic) -> int | None:
    if not clinic.last_verified_at:
        return None
    now = datetime.now(timezone.utc)
    verified = clinic.last_verified_at
    if verified.tzinfo is None:
        verified = verified.replace(tzinfo=timezone.utc)
    return (now - verified).days

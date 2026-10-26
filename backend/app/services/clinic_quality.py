"""Data completeness scoring (not clinical quality)."""

from app.models import Clinic

TRACKED_FIELDS = (
    "name",
    "address",
    "phone",
    "medical_services",
    "accepted_insurance",
    "languages",
    "accessibility_features",
    "operating_hours",
    "website",
)


def compute_completeness(clinic: Clinic) -> int:
    score = 0
    step = 100 // len(TRACKED_FIELDS)
    if clinic.name:
        score += step
    if clinic.address and clinic.city and clinic.postal_code:
        score += step
    if clinic.phone:
        score += step
    if clinic.medical_services:
        score += step
    if clinic.accepted_insurance:
        score += step
    if clinic.languages:
        score += step
    if clinic.accessibility_features:
        score += step
    hours = clinic.operating_hours or {}
    if hours.get("summary") or hours.get("schedule"):
        score += step
    if clinic.website:
        score += step
    return min(100, score)

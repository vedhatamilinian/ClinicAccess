"""Detect multi-service clinics and referral-style care pathways."""

from __future__ import annotations

REFERRAL_PATHWAY_TOKENS: tuple[str, ...] = (
    "referral",
    "specialist",
    "behavioral",
    "mental",
    "counseling",
    "dental",
    "women",
    "pediatric",
    "pharmacy",
    "telehealth",
    "lab",
    "immunization",
    "urgent",
)


def coordinated_care_signals(services: list[str]) -> tuple[int, bool, list[str]]:
    """
    Returns (service_count, has_referral_pathway, matched_pathway_labels).
    """
    cleaned = [s.strip() for s in services if s and str(s).strip()]
    if not cleaned:
        return 0, False, []

    lower_joined = " ".join(s.lower() for s in cleaned)
    pathways = [token for token in REFERRAL_PATHWAY_TOKENS if token in lower_joined]
    return len(cleaned), bool(pathways), pathways

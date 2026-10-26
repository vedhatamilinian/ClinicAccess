"""County-wide Fulton BOH fields sourced from official pages (not per-location pages)."""

from __future__ import annotations

# https://fultoncountyboh.com/services/insurance-plans/ (verified in curated import metadata)
BOH_ACCEPTED_INSURANCE: list[str] = [
    "Medicaid",
    "Medicare",
    "Peach State Health Plan",
    "Self-pay",
    "Private insurance",
]

# English + Spanish listed for BOH clinics (e.g. NPIN org profile); LEP interpreter line available county-wide.
# https://www.fultoncountyga.gov/inside-fulton-county/fulton-county-departments/customer-service/translation
BOH_LANGUAGES: list[str] = ["English", "Spanish"]

BOH_INSURANCE_SOURCE_URL = "https://fultoncountyboh.com/services/insurance-plans/"
BOH_LANGUAGE_SOURCE_URL = (
    "https://www.fultoncountyga.gov/inside-fulton-county/fulton-county-departments/customer-service/translation"
)

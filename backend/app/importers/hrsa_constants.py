"""Program-level defaults for HRSA health center sites when the HCSD CSV has no per-site values."""

from __future__ import annotations

# HRSA Health Center Program sites serve underserved populations and bill Medicare when enrolled;
# Medicaid and sliding-fee/self-pay are standard program expectations — users must confirm specific plans.
# https://bphc.hrsa.gov/about-health-centers/health-center-program-impact
HRSA_FQHC_TYPICAL_INSURANCE: list[str] = ["Medicaid", "Medicare", "Self-pay"]

HRSA_FQHC_INSURANCE_NOTE = (
    "Typical for HRSA-funded health centers; confirm your specific insurance plan with the site."
)

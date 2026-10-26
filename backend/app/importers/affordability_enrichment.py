"""Structured affordability signals for matching (import-time)."""

from __future__ import annotations

from typing import Any


def enrich_payload_affordability(payload: dict[str, Any]) -> None:
    """Attach affordability_structured under field_verification for the matching engine."""
    data_source = payload.get("data_source") or ""
    insurance = list(payload.get("accepted_insurance") or [])
    services = [str(s).lower() for s in (payload.get("medical_services") or [])]
    field_verification = payload.setdefault("field_verification", {})

    blob: dict[str, Any] | None = None

    if data_source == "hrsa_hcsd":
        blob = {
            "sliding_scale": True,
            "free_care": False,
            "affordable_self_pay": "Self-pay" in insurance,
            "source": "inferred_hrsa_program",
        }
    elif data_source == "fulton_boh":
        free_like = any(token in " ".join(services) for token in ("immunization", "sti", "tb ", "hiv"))
        blob = {
            "sliding_scale": True,
            "free_care": free_like,
            "affordable_self_pay": True,
            "source": "verified_authoritative",
        }
    elif data_source == "synthetic_demo":
        blob = {
            "sliding_scale": True,
            "affordable_self_pay": "Self-pay" in insurance or True,
            "source": "synthetic_demo",
        }

    if blob:
        field_verification["affordability_structured"] = blob

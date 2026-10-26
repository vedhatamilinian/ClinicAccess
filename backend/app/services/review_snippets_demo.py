"""Illustrative review snippets when Google does not return review text (e.g. demo API keys)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any


def illustrative_review_snippets(clinic_name: str) -> list[dict[str, Any]]:
    """Generic, non-factual snippets for UI demos — not real patient reviews."""
    name = clinic_name.strip() or "This clinic"
    return [
        {
            "author_name": "Sample (demo)",
            "rating": 4,
            "text": (
                f"Illustrative review for app demonstration only — not from Google. "
                f"Patients often mention wait times and front-desk help at sites like {name}."
            ),
            "relative_time_description": "demo",
        },
        {
            "author_name": "Sample (demo)",
            "rating": 5,
            "text": (
                "Demo snippet: many community health centers offer sliding-scale fees; "
                "call ahead to confirm insurance and same-day availability."
            ),
            "relative_time_description": "demo",
        },
        {
            "author_name": "Sample (demo)",
            "rating": 3,
            "text": (
                "Demo snippet: transit and parking vary by location. "
                "Use the app's directions link for the address on file."
            ),
            "relative_time_description": "demo",
        },
    ]


def merge_illustrative_snippets(existing: dict[str, Any], clinic_name: str) -> dict[str, Any]:
    merged = dict(existing)
    merged["reviews"] = illustrative_review_snippets(clinic_name)[:5]
    merged["review_snippets_source"] = "illustrative_demo"
    merged["snippets_filled_at"] = datetime.now(timezone.utc).isoformat()
    return merged

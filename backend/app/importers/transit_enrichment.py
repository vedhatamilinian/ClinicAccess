"""Attach derived transit fields to clinic import payloads."""

from __future__ import annotations

from typing import Any

from app.importers.marta_transit import assess_marta_rail_proximity, transit_note


def enrich_payload_transit(payload: dict[str, Any]) -> None:
    lat = payload.get("latitude")
    lon = payload.get("longitude")
    if lat is None or lon is None:
        return

    proximity = assess_marta_rail_proximity(float(lat), float(lon))
    payload["transit_options"] = proximity.transit_options
    verification = payload.setdefault("field_verification", {})
    verification["transit_options"] = proximity.verification

    description = payload.get("description") or ""
    note = transit_note(proximity)
    if note not in description:
        payload["description"] = f"{description} {note}".strip()

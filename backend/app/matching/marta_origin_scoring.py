"""MARTA transportation scoring from the user's origin and clinic access."""

from __future__ import annotations

from app.importers.marta_transit import (
    RAIL_NEARBY_MILES,
    assess_marta_rail_proximity,
    MartaProximity,
)
from app.matching.geo import valid_coordinate
from app.matching.types import CriterionResult, CriterionStatus, UserPreferences
from app.models import Clinic


def _access_fraction(proximity: MartaProximity) -> float:
    if "marta" in proximity.transit_options:
        return 1.0
    if "marta_bus" in proximity.transit_options:
        return 0.8
    miles = proximity.distance_miles
    if miles <= RAIL_NEARBY_MILES:
        return 1.0
    if miles <= 1.5:
        return 0.5
    if miles <= 3.0:
        return 0.25
    return 0.0


def _clinic_access_fraction(clinic: Clinic) -> tuple[float, MartaProximity | None, bool]:
    """Returns (fraction, optional live proximity, has_documented_transit)."""
    options = clinic.transit_options or []
    if options:
        if "marta" in options:
            return 1.0, None, True
        if "marta_bus" in options:
            return 0.8, None, True
        if "transit_not_within_walking_distance" in options or "rail_not_within_walking_distance" in options:
            return 0.0, None, True
    if valid_coordinate(clinic.latitude, clinic.longitude):
        prox = assess_marta_rail_proximity(clinic.latitude, clinic.longitude)
        return _access_fraction(prox), prox, bool(options)
    return 0.0, None, False


def _status_from_fraction(combined: float) -> CriterionStatus:
    if combined >= 0.75:
        return "match"
    if combined > 0:
        return "partial"
    return "mismatch"


def score_marta_transportation_from_origin(
    clinic: Clinic,
    prefs: UserPreferences,
    weight: float,
    field_verification: str | None,
) -> CriterionResult:
    user_prox = assess_marta_rail_proximity(prefs.origin_latitude, prefs.origin_longitude)
    user_frac = _access_fraction(user_prox)
    clinic_frac, clinic_prox, documented = _clinic_access_fraction(clinic)

    if not documented and clinic_frac == 0.0 and clinic_prox is None:
        return CriterionResult(
            "transportation",
            "Transportation",
            0.0,
            weight,
            "unknown",
            explanation="Public transit proximity is not documented for this clinic.",
        )

    combined = min(user_frac, clinic_frac)
    score = round(weight * combined, 1)
    status = _status_from_fraction(combined)
    origin_label = prefs.origin_label or "your location"

    user_near_rail = "marta" in user_prox.transit_options
    user_near_bus = "marta_bus" in user_prox.transit_options

    if user_near_rail:
        start = f"From {origin_label}, ~{user_prox.distance_miles:.1f} mi straight-line to {user_prox.nearest_station} (MARTA rail)."
    elif user_near_bus and user_prox.nearest_bus_stop and user_prox.bus_distance_miles is not None:
        start = (
            f"From {origin_label}, ~{user_prox.bus_distance_miles:.1f} mi to bus stop "
            f"{user_prox.nearest_bus_stop} (no rail within walking distance)."
        )
    else:
        start = (
            f"From {origin_label}, nearest MARTA rail is ~{user_prox.distance_miles:.1f} mi "
            f"({user_prox.nearest_station}) , limited walk-up access."
        )

    options = clinic.transit_options or []
    if "marta" in options:
        clinic_part = "Clinic is within ~0.75 mi of MARTA rail (imported GTFS)."
    elif "marta_bus" in options:
        clinic_part = "Clinic is within ~0.25 mi of a MARTA bus stop (imported GTFS)."
    elif clinic_prox and "marta" in clinic_prox.transit_options:
        clinic_part = (
            f"Clinic is ~{clinic_prox.distance_miles:.1f} mi from {clinic_prox.nearest_station} (MARTA rail)."
        )
    elif clinic_prox and "marta_bus" in clinic_prox.transit_options:
        clinic_part = "Clinic has nearby MARTA bus access per GTFS."
    elif "transit_not_within_walking_distance" in options or "rail_not_within_walking_distance" in options:
        clinic_part = "Clinic is not within walking distance of MARTA per GTFS."
    else:
        clinic_part = "Clinic transit access is limited per available data."

    explanation = f"{start} {clinic_part} Straight-line estimates only , not trip routing or schedules."

    return CriterionResult(
        "transportation",
        "Transportation",
        score,
        weight,
        status,
        explanation=explanation,
        source=field_verification or user_prox.verification,
    )

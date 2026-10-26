"""Configurable matching weights (design assumptions — not clinical standards)."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class MatchingWeights:
    distance: float = 15.0
    affordability: float = 15.0
    coordinated_care: float = 10.0
    appointment: float = 15.0
    language: float = 15.0
    accessibility: float = 15.0
    transportation: float = 15.0

    @property
    def total(self) -> float:
        return (
            self.distance
            + self.affordability
            + self.coordinated_care
            + self.appointment
            + self.language
            + self.accessibility
            + self.transportation
        )


def weights_for_preferences(cost_is_barrier: bool) -> MatchingWeights:
    """When cost is a barrier, affordability weighs more in the normalized score."""
    base = DEFAULT_WEIGHTS
    if not cost_is_barrier:
        return base
    return MatchingWeights(
        distance=12.0,
        affordability=25.0,
        coordinated_care=base.coordinated_care,
        appointment=13.0,
        language=13.0,
        accessibility=13.0,
        transportation=13.0,
    )


DEFAULT_WEIGHTS = MatchingWeights()

# Straight-line distance model (miles). Configurable for tests.
MAX_DISTANCE_MILES = 10.0
PREFERRED_DISTANCE_MILES = 3.0

# Appointment text considered stale after this many days (if last_verified_at present).
APPOINTMENT_INFO_STALE_DAYS = 365

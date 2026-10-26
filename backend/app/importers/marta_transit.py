"""MARTA transit proximity from official GTFS stop data (see scripts/sync_marta_gtfs.py)."""

from __future__ import annotations

import math
from dataclasses import dataclass

from app.importers.marta_gtfs_loader import gtfs_data_available, load_bus_stops, load_rail_stations

# Walking distance thresholds (straight-line miles).
RAIL_NEARBY_MILES = 0.75
BUS_NEARBY_MILES = 0.25

TRANSIT_NEAR_RAIL = ("marta", "public_transit")
TRANSIT_NEAR_BUS = ("marta_bus", "public_transit")
TRANSIT_NOT_NEAR = ("transit_not_within_walking_distance",)
# Legacy imports may still store this token until re-imported.
LEGACY_NOT_NEAR_RAIL = "rail_not_within_walking_distance"

VERIFICATION_GTFS = "marta_gtfs"
VERIFICATION_FALLBACK = "derived_marta_proximity"

# Used only when backend/data/marta/*.json has not been synced yet.
_FALLBACK_RAIL_STATIONS: tuple[tuple[str, float, float], ...] = (
    ("Five Points", 33.7537, -84.3915),
    ("Georgia State", 33.7500, -84.3860),
    ("Peachtree Center", 33.759684, -84.387598),
    ("Civic Center", 33.76634, -84.38749),
    ("North Avenue", 33.77179, -84.38709),
    ("Midtown", 33.78107, -84.38632),
    ("Arts Center", 33.78918, -84.38728),
    ("Lindbergh Center", 33.82291, -84.36947),
    ("Buckhead", 33.84773, -84.36766),
    ("Medical Center", 33.91072, -84.35145),
    ("Airport", 33.640806, -84.446214),
)


@dataclass(frozen=True)
class MartaProximity:
    nearest_station: str
    distance_miles: float
    nearest_bus_stop: str
    bus_distance_miles: float | None
    transit_options: list[str]
    verification: str


def _haversine_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    earth_radius_miles = 3958.8
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    )
    return earth_radius_miles * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _nearest_rail(latitude: float, longitude: float) -> tuple[str, float]:
    stations = load_rail_stations()
    if stations:
        nearest_name = ""
        nearest_miles = float("inf")
        for name, lat, lon, _stop_id in stations:
            miles = _haversine_miles(latitude, longitude, lat, lon)
            if miles < nearest_miles:
                nearest_miles = miles
                nearest_name = name
        return nearest_name, nearest_miles

    nearest_name = ""
    nearest_miles = float("inf")
    for name, lat, lon in _FALLBACK_RAIL_STATIONS:
        miles = _haversine_miles(latitude, longitude, lat, lon)
        if miles < nearest_miles:
            nearest_miles = miles
            nearest_name = name
    return nearest_name, nearest_miles


def _nearest_bus(latitude: float, longitude: float) -> tuple[str, float] | None:
    stops = load_bus_stops()
    if not stops:
        return None
    nearest_name = ""
    nearest_miles = float("inf")
    for name, lat, lon, _stop_id in stops:
        miles = _haversine_miles(latitude, longitude, lat, lon)
        if miles < nearest_miles:
            nearest_miles = miles
            nearest_name = name
    return nearest_name, nearest_miles


def assess_marta_rail_proximity(latitude: float, longitude: float) -> MartaProximity:
    """Assess MARTA rail and bus proximity for a clinic coordinate."""
    rail_name, rail_miles = _nearest_rail(latitude, longitude)
    bus = _nearest_bus(latitude, longitude)
    bus_name = bus[0] if bus else ""
    bus_miles: float | None = bus[1] if bus else None

    near_rail = rail_miles <= RAIL_NEARBY_MILES
    near_bus = bus_miles is not None and bus_miles <= BUS_NEARBY_MILES

    options: list[str] = []
    if near_rail:
        options.extend(TRANSIT_NEAR_RAIL)
    if near_bus:
        for token in TRANSIT_NEAR_BUS:
            if token not in options:
                options.append(token)
    if not options:
        options = list(TRANSIT_NOT_NEAR)

    verification = VERIFICATION_GTFS if gtfs_data_available() else VERIFICATION_FALLBACK

    return MartaProximity(
        nearest_station=rail_name,
        distance_miles=rail_miles,
        nearest_bus_stop=bus_name,
        bus_distance_miles=bus_miles,
        transit_options=options,
        verification=verification,
    )


def transit_note(proximity: MartaProximity) -> str:
    parts: list[str] = []
    rail_dist = f"{proximity.distance_miles:.1f} mi"
    if "marta" in proximity.transit_options:
        parts.append(f"MARTA rail ~{rail_dist} to {proximity.nearest_station} (MARTA GTFS).")
    elif proximity.nearest_station:
        parts.append(f"Nearest MARTA rail: {proximity.nearest_station} (~{rail_dist}).")

    if proximity.bus_distance_miles is not None and proximity.nearest_bus_stop:
        bus_dist = f"{proximity.bus_distance_miles:.1f} mi"
        if "marta_bus" in proximity.transit_options:
            parts.append(f"MARTA bus stop ~{bus_dist} to {proximity.nearest_bus_stop} (MARTA GTFS).")
        else:
            parts.append(f"Nearest MARTA bus stop: {proximity.nearest_bus_stop} (~{bus_dist}).")

    return " ".join(parts) if parts else "MARTA transit proximity from GTFS schedule data."

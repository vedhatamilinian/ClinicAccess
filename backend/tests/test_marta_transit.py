import json
from pathlib import Path

from app.importers.marta_transit import assess_marta_rail_proximity, VERIFICATION_GTFS


def test_downtown_clinic_near_marta_rail():
    # Near Five Points / Georgia State
    result = assess_marta_rail_proximity(33.749, -84.388)
    assert "marta" in result.transit_options
    assert result.distance_miles <= 0.75
    assert result.verification == VERIFICATION_GTFS


def test_near_marta_bus_stop_when_rail_is_far():
    bus = json.loads((Path(__file__).resolve().parents[1] / "data" / "marta" / "bus_stops.json").read_text())
    stop = bus[0]
    lat, lon = stop["latitude"], stop["longitude"]
    result = assess_marta_rail_proximity(lat, lon)
    assert "marta_bus" in result.transit_options


def test_remote_north_fulton_not_near_rail():
    result = assess_marta_rail_proximity(34.05, -84.28)
    assert result.transit_options == ["transit_not_within_walking_distance"]
    assert result.distance_miles > 0.75

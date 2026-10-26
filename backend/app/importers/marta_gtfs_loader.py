"""Load MARTA GTFS extracts shipped under backend/data/marta/."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

_DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "marta"


@lru_cache
def load_rail_stations() -> tuple[tuple[str, float, float, str], ...]:
    path = _DATA_DIR / "rail_stations.json"
    if not path.is_file():
        return ()
    raw = json.loads(path.read_text(encoding="utf-8"))
    return tuple((str(s["name"]), float(s["latitude"]), float(s["longitude"]), str(s["stop_id"])) for s in raw)


@lru_cache
def load_bus_stops() -> tuple[tuple[str, float, float, str], ...]:
    path = _DATA_DIR / "bus_stops.json"
    if not path.is_file():
        return ()
    raw = json.loads(path.read_text(encoding="utf-8"))
    return tuple((str(s["name"]), float(s["latitude"]), float(s["longitude"]), str(s["stop_id"])) for s in raw)


def gtfs_data_available() -> bool:
    return bool(load_rail_stations())

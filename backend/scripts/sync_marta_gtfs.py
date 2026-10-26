#!/usr/bin/env python3
"""Download MARTA GTFS and write cached stop data for clinic transit enrichment."""

from __future__ import annotations

import csv
import io
import json
import sys
import zipfile
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
import httpx

GTFS_URL = "https://itsmarta.com/google_transit_feed/google_transit.zip"
DATA_DIR = Path(__file__).resolve().parents[1] / "data" / "marta"

# Fulton County + nearby clinic service area (approximate).
BUS_BBOX = (33.45, 34.05, -84.65, -84.15)


def _download_gtfs() -> bytes:
    print(f"Downloading {GTFS_URL} …")
    response = httpx.get(GTFS_URL, timeout=120.0, follow_redirects=True)
    response.raise_for_status()
    return response.content


def _rail_stations(zf: zipfile.ZipFile, routes: dict[str, int], trip_route: dict[str, int]) -> list[dict]:
    stops = list(csv.DictReader(io.TextIOWrapper(zf.open("stops.txt"), encoding="utf-8-sig")))
    parents = {s["stop_id"]: s for s in stops if s.get("location_type") == "1"}
    child_to_parent: dict[str, str] = {}
    for s in stops:
        parent = s.get("parent_station") or ""
        if parent:
            child_to_parent[s["stop_id"]] = parent

    stop_route_types: dict[str, set[int]] = defaultdict(set)
    reader = csv.DictReader(io.TextIOWrapper(zf.open("stop_times.txt"), encoding="utf-8-sig"))
    for row in reader:
        trip_id = row["trip_id"]
        route_type = trip_route.get(trip_id)
        if route_type is None:
            continue
        stop_id = row["stop_id"]
        parent_id = child_to_parent.get(stop_id, stop_id)
        stop_route_types[parent_id].add(route_type)

    rail: list[dict] = []
    for parent_id, route_types in stop_route_types.items():
        if parent_id not in parents:
            continue
        if not (1 in route_types or 0 in route_types):
            continue
        station = parents[parent_id]
        rail.append(
            {
                "stop_id": station["stop_id"],
                "name": station["stop_name"],
                "latitude": float(station["stop_lat"]),
                "longitude": float(station["stop_lon"]),
            }
        )
    rail.sort(key=lambda s: s["name"])
    return rail


def _bus_stops(zf: zipfile.ZipFile, bus_route_ids: set[str]) -> list[dict]:
    bus_trip_ids = {
        row["trip_id"]
        for row in csv.DictReader(io.TextIOWrapper(zf.open("trips.txt"), encoding="utf-8-sig"))
        if row["route_id"] in bus_route_ids
    }
    bus_stop_ids: set[str] = set()
    reader = csv.DictReader(io.TextIOWrapper(zf.open("stop_times.txt"), encoding="utf-8-sig"))
    for row in reader:
        if row["trip_id"] in bus_trip_ids:
            bus_stop_ids.add(row["stop_id"])

    lat_min, lat_max, lon_min, lon_max = BUS_BBOX
    stops_by_id = {
        s["stop_id"]: s for s in csv.DictReader(io.TextIOWrapper(zf.open("stops.txt"), encoding="utf-8-sig"))
    }
    points: list[dict] = []
    for stop_id in bus_stop_ids:
        stop = stops_by_id.get(stop_id)
        if not stop:
            continue
        lat = float(stop["stop_lat"])
        lon = float(stop["stop_lon"])
        if not (lat_min <= lat <= lat_max and lon_min <= lon <= lon_max):
            continue
        points.append(
            {
                "stop_id": stop_id,
                "name": stop["stop_name"],
                "latitude": lat,
                "longitude": lon,
            }
        )
    return points


def main() -> int:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    payload = _download_gtfs()
    zip_path = DATA_DIR / "google_transit.zip"
    zip_path.write_bytes(payload)
    print(f"Saved {zip_path} ({len(payload) // 1_000_000} MB)")

    with zipfile.ZipFile(io.BytesIO(payload)) as zf:
        routes = {
            row["route_id"]: int(row["route_type"])
            for row in csv.DictReader(io.TextIOWrapper(zf.open("routes.txt"), encoding="utf-8-sig"))
        }
        trip_route = {
            row["trip_id"]: routes[row["route_id"]]
            for row in csv.DictReader(io.TextIOWrapper(zf.open("trips.txt"), encoding="utf-8-sig"))
        }
        bus_route_ids = {rid for rid, rtype in routes.items() if rtype == 3}

        rail = _rail_stations(zf, routes, trip_route)
        bus = _bus_stops(zf, bus_route_ids)

    meta = {
        "source_url": GTFS_URL,
        "synced_at": datetime.now(timezone.utc).isoformat(),
        "rail_station_count": len(rail),
        "bus_stop_count": len(bus),
        "bus_bbox": {"lat_min": BUS_BBOX[0], "lat_max": BUS_BBOX[1], "lon_min": BUS_BBOX[2], "lon_max": BUS_BBOX[3]},
    }
    (DATA_DIR / "gtfs_meta.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
    (DATA_DIR / "rail_stations.json").write_text(json.dumps(rail, indent=2) + "\n", encoding="utf-8")
    (DATA_DIR / "bus_stops.json").write_text(json.dumps(bus, separators=(",", ":")) + "\n", encoding="utf-8")

    print(f"Wrote {len(rail)} rail stations and {len(bus)} bus stops to {DATA_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

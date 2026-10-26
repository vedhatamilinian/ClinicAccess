# ClinicAccess data sources (v1)

Scope: **FQHC/LAL (HRSA)** sites in **Georgia** (Fulton, Gwinnett, and Forsyth counties; congressional district 7) plus **Fulton County Board of Health** public health sites.

## HRSA — Health Center Service Delivery and Look-Alike Sites

- **Download:** https://data.hrsa.gov/data/download (CSV, no API key)
- **Import:** `python scripts/import_hrsa_fulton.py`
- **Fields:** name, organization, address, phone, website, coordinates, facility type
- **Insurance:** program-typical values (`Medicaid`, `Medicare`, `Self-pay`) with `inferred_hrsa_program` — HRSA site CSV has no plan list; users should confirm with the site
- **Languages:** not in CSV (left empty); ask the site about interpreter services
- **Transit:** [MARTA GTFS](https://itsmarta.com/google_transit_feed/google_transit.zip) — rail within ~0.75 mi and bus stops within ~0.25 mi (`marta_gtfs`); refresh with `python scripts/sync_marta_gtfs.py`
- **Not provided:** accessibility, hours (left empty)

## Fulton County Board of Health

- **Curated file:** `backend/data/fulton_boh_sites.json` (from https://fultoncountyboh.com/locations/)
- **Import:** `python scripts/import_boh_fulton.py` (geocodes addresses via OpenStreetMap Nominatim; attribution required)
- **Fields:** name, address, phone, hours summary, services list
- **Insurance & languages:** county-wide lists from [insurance plans](https://fultoncountyboh.com/services/insurance-plans/) and [county translation services](https://www.fultoncountyga.gov/inside-fulton-county/fulton-county-departments/customer-service/translation) (English/Spanish; interpreter line for other languages)
- **Transit:** same MARTA GTFS enrichment as HRSA imports
- **Coordinates:** `derived_geocode` with provenance rows in `clinic_field_provenance`

## Google Places (optional enrichment)

- **API:** Google Maps Platform — **Places API (New)** `places:searchText` (`rating`, `userRatingCount`, `reviews`, `googleMapsUri`)
- **Env:** `GOOGLE_MAPS_API_KEY` in `backend/.env`
- **Import:** `python scripts/enrich_google_reviews.py` (HRSA + BOH clinics by default). Uses **Place Details** when `place_id` is already cached (avoids Text Search daily quota). Pass `--search` only for clinics missing `place_id`.
- **Storage:** `clinics.google_reviews` JSON; `field_verification.google_reviews` = `google_places_api`
- **App:** star ratings and up to five cached snippets on clinic detail; always link out to Google Maps for full listings
- **Review text:** many API keys return ratings only. For demos without Enterprise billing: `python scripts/backfill_illustrative_review_snippets.py` (labeled `illustrative_demo`, not real Google quotes)

## MARTA GTFS (transit enrichment)

- **Schedule feed:** https://itsmarta.com/google_transit_feed/google_transit.zip (official; no API key)
- **Sync:** `python scripts/sync_marta_gtfs.py` → `backend/data/marta/rail_stations.json`, `bus_stops.json`
- **Import-time:** HRSA/BOH importers call `enrich_payload_transit` (straight-line distance to GTFS rail stations and bus stops)
- **Realtime (optional):** MARTA offers rail arrival and bus GTFS-RT feeds for app developers — https://www.itsmarta.com/app-developer-resources.aspx (API key required for rail REST)

## Demo data

- `python scripts/seed_database.py` — 12 fictional clinics (`synthetic_demo`)
- API: `include_demo=true` only for testing

## Scoring

- **Endpoint:** `POST /api/v1/recommendations`
- **Engine:** `app/matching/` (configurable weights in `matching/config.py`)
- **Stage A — mandatory:** required service / insurance / language when user marks essential; `excluded` vs `needs_verification` vs `eligible`
- **Stage B — preferences (default weights, total 100):** distance 15, affordability 15, coordinated care 10, appointment 15, language 15, accessibility 15, transportation 15. When **cost is a barrier** is on in Profile, affordability weight increases to 25 (distance 12, others 13).
- Scores normalize over **applicable** criteria only; missing data is `unknown`, not a confirmed mismatch
- `data_completeness` is separate from match score

## Refresh order

```bash
cd backend
source .venv/bin/activate
python scripts/seed_database.py
python scripts/import_hrsa_fulton.py
python scripts/import_boh_fulton.py
python scripts/sync_marta_gtfs.py   # refresh MARTA stops before re-import if schedules changed
```

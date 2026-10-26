# ClinicAccess — FastAPI Backend



## Requirements

- Python 3.11+ recommended
- Node.js 20+ for the Expo app

## Setup (macOS / Linux)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python scripts/seed_database.py
python scripts/import_hrsa_fulton.py
python scripts/import_boh_fulton.py
python scripts/import_community_resources.py
# Optional: cache Google star ratings and review snippets (requires GOOGLE_MAPS_API_KEY)
python scripts/check_google_places_key.py   # ratings vs review-text access
python scripts/enrich_google_reviews.py --force
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

```

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite path (default `sqlite:///./clinicaccess.db`) |
| `CORS_ORIGINS` | Comma-separated Expo dev origins |
| `ADMIN_API_KEY` | Required header `X-Admin-API-Key` for POST/PATCH/DELETE |
| `GOOGLE_MAPS_API_KEY` | Optional — Places API for `scripts/enrich_google_reviews.py` |




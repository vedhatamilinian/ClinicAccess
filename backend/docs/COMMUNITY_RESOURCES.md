# Community resources (Fulton County)

Curated **official** referrals — not a live scrape of 211 or partner APIs.

## Dataset

- File: `backend/data/fulton_community_resources.json`
- Import: `python scripts/import_community_resources.py`
- Records: verified phone/website/address from organization or government pages (`verification_status=verified_authoritative`)

## API

- `GET /api/v1/community-resources` — search, category, ZIP, language, distance filters
- `GET /api/v1/community-resources/{id}` — detail

## Gaps

- No United Way 211 API integration (call **211** or use 211.org for live referrals).
- Atlanta Community Food Bank pantry hours are per partner site — see ACFB website.
- Program funding and shelter bed availability are **not** real-time in this dataset.

## Refresh

Re-run import after editing the JSON; import upserts by `id` and does not delete missing rows.

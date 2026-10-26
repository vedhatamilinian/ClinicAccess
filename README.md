# ClinicAccess

ClinicAccess helps Fulton County residents find healthcare and community support based on real-life needs—insurance, language, distance, transportation, accessibility, and services—not just the nearest address.

## Features

- **Find Care** — Search clinics with explainable match scores, filters, and sorting (live API or bundled offline sample clinics).
- **Map** — Explore clinic locations with filters, optional device location, and directions links.
- **Community Resources** — Curated food, housing, transit, benefits, and crisis support listings with source links.
- **Profile** — Care preferences, favorites, settings (theme), help, and about.
- **Backend** — FastAPI + SQLite with HRSA and Fulton Board of Health imports, MARTA GTFS (rail + bus stop proximity), and recommendation scoring.

Scores and match reasons are informational only. They are not medical advice and do not diagnose or recommend treatment.

## Connect the mobile app to the API

1. Start the API from `backend/` on port `8000` (bind `0.0.0.0` for physical devices). See [backend/README.md](backend/README.md) for import scripts and tests.
2. Copy `.env.example` to `.env` in the project root.
3. Set `EXPO_PUBLIC_API_BASE_URL`:
   - Simulator/emulator: `http://127.0.0.1:8000`
   - Physical phone: `http://<your-computer-LAN-IP>:8000` (not `localhost`)
4. Restart Expo: `npx expo start --clear`

If `EXPO_PUBLIC_API_BASE_URL` is set but the API is unreachable, Find Care shows an error and **does not** silently use bundled demo data. Omit the variable to run entirely on bundled sample clinics (clearly labeled in the app).

On a physical iPhone with Expo Go, the phone and Mac must be on the same reachable Wi‑Fi. Start the API with `--host 0.0.0.0` so it is not bound only to `127.0.0.1`. Find your Mac’s LAN IP with `ipconfig getifaddr en0` and put that address in `.env` (not `localhost`).

## Technology stack

- React Native and Expo SDK 57
- Expo Router
- TypeScript
- React Context and AsyncStorage (theme, preferences, favorites, recent searches)
- `react-native-maps` and `expo-location` (Map tab)
- FastAPI, SQLAlchemy, SQLite (development backend)

## Folder structure

```text
app/                 Expo Router routes and navigation layouts
  (tabs)/            Home, Find Care, Map, Resources, and Profile tabs
  clinics/           Dynamic clinic detail route
components/          Reusable screen, card, form, layout, and UI components
constants/           Theme tokens, app text, and route names
contexts/            Theme, preferences, favorites, and search history
data/                Offline sample clinic fallback when no API URL is set
backend/             FastAPI service, SQLite models, tests, import scripts
services/            Recommendation engine, API client, and mappers
hooks/               Reusable React hooks
types/               Shared TypeScript types
utils/               Filters, sorting, navigation helpers
assets/              App artwork notes and placeholders
```

## Run the app

1. Install Node.js LTS and the Expo Go app on a phone, or an iOS/Android simulator.
2. Run `npm install`.
3. Run `npx expo start`.
4. Scan the QR code with Expo Go, or press `i` for iOS / `a` for Android.

## Congressional App Challenge demo

Full script, timing, and checklist: **[docs/DEMO.md](docs/DEMO.md)**.

1. `cd backend && source .venv/bin/activate && python scripts/prepare_demo.py`
2. `uvicorn app.main:app --host 0.0.0.0 --port 8000`
3. In `.env`: set `EXPO_PUBLIC_API_BASE_URL`.
4. Follow **Profile → Find Care → clinic detail → Map → Resources → About** (see docs/DEMO.md).

## Manual checks

- Confirm the splash screen fades into Home.
- Switch between all five tabs.
- Open Settings from Profile and test System, Light, and Dark modes.
- Open About from Profile and review data-source disclaimers.
- Open Find Care, search for a service such as `primary care`, and open a clinic card.
- Change care preferences and confirm scores update when using bundled data or the API.
- Apply filters and sort options on Find Care and Map.
- Save clinics and community resources to favorites.
- With the API running, confirm HRSA/BOH clinics appear and synthetic demo records stay hidden unless `include_demo=true`.

## Map notes

The Map tab uses Apple Maps on iOS in Expo Go and loads clinics from the live API. Android production builds may need a Google Maps key per [Expo map docs](https://docs.expo.dev/versions/v57.0.0/sdk/map-view/).

## Data and limitations

- Verified clinic rows come from HRSA health center sites and Fulton County Board of Health imports (`backend/docs/DATA_SOURCES.md`).
- Twelve fictional clinics exist for development tests (`include_demo=true`); they are excluded from default API responses.
- Community resources are curated listings, not live 211 feeds.

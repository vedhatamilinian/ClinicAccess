from datetime import datetime, timezone
from unittest.mock import patch

from app.importers.boh import site_to_clinic_payload
from app.importers.geocode import GeocodeResult


def test_boh_site_includes_county_insurance_and_languages():
    site = {
        "id": "boh-test",
        "name": "Test Health Center",
        "city": "Atlanta",
        "state": "GA",
        "postal_code": "30303",
        "address": "1 Test St",
        "phone": "404-555-0100",
        "hours_summary": "Mon–Fri 8–5",
        "services": ["Immunizations"],
    }
    fake = GeocodeResult(
        latitude=33.75,
        longitude=-84.39,
        provider="derived_geocode_census",
        matched_query="1 Test St, Atlanta, GA 30303",
    )
    with patch("app.importers.boh.resolve_us_address", return_value=fake):
        payload = site_to_clinic_payload(site, "https://fultoncountyboh.com/locations/", datetime.now(timezone.utc))

    assert "Medicaid" in payload["accepted_insurance"]
    assert "Peach State Health Plan" in payload["accepted_insurance"]
    assert payload["languages"] == ["English", "Spanish"]
    assert payload["field_verification"]["accepted_insurance"] == "verified_authoritative"
    assert payload["field_verification"]["transit_options"] == "marta_gtfs"
    assert len(payload["transit_options"]) > 0

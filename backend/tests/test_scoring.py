from app.models import Clinic
from app.matching.types import UserPreferences
from app.matching.engine import score_clinic


def _clinic(**overrides):
    base = {
        "id": "test-1",
        "name": "Test Clinic",
        "organization_name": "Org",
        "description": "x",
        "address": "1 Main St",
        "city": "Atlanta",
        "state": "GA",
        "postal_code": "30303",
        "latitude": 33.75,
        "longitude": -84.39,
        "phone": "404-555-0100",
        "website": None,
        "facility_type": "fqhc",
        "medical_services": ["Primary care"],
        "accepted_insurance": ["Medicaid"],
        "languages": ["English"],
        "accessibility_features": ["wheelchair_accessible"],
        "transit_options": [],
        "operating_hours": {"summary": "Mon-Fri"},
        "appointment_information": "",
        "data_source": "hrsa_hcsd",
        "record_status": "active",
        "data_completeness_score": 0,
        "field_verification": {"accepted_insurance": "verified_authoritative"},
    }
    base.update(overrides)
    return Clinic(**base)


def test_unknown_insurance_does_not_score_as_match():
    clinic = _clinic(accepted_insurance=[])
    prefs = UserPreferences(insurance="Medicaid", language="English", transportation="Car", needs_wheelchair_access=False)
    result = score_clinic(clinic, prefs)
    aff = next(c for c in result["components"] if c["key"] == "affordability")
    assert aff["status"] == "unknown"
    assert aff["score"] == 0


def test_mandatory_insurance_blocks_when_unknown():
    clinic = _clinic(accepted_insurance=[])
    prefs = UserPreferences(
        insurance="Medicaid",
        language="English",
        transportation="Car",
        needs_wheelchair_access=False,
        required_insurance=True,
    )
    result = score_clinic(clinic, prefs)
    assert result["eligibility_status"] == "needs_verification"
    assert result["mandatory_blocked"] is True


def test_confirmed_insurance_match_scores():
    clinic = _clinic(accepted_insurance=["Medicaid"])
    prefs = UserPreferences(insurance="Medicaid", language="English", transportation="Car", needs_wheelchair_access=False)
    result = score_clinic(clinic, prefs)
    aff = next(c for c in result["components"] if c["key"] == "affordability")
    assert aff["status"] == "match"
    assert aff["score"] > 0

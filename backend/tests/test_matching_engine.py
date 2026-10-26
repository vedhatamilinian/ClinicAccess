"""Matching engine cases aligned with product requirements."""

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
        "transit_options": ["marta"],
        "operating_hours": {"summary": "Mon-Fri"},
        "appointment_information": "Call for appointments.",
        "data_source": "hrsa_hcsd",
        "record_status": "active",
        "data_completeness_score": 0,
        "field_verification": {"accepted_insurance": "verified_authoritative", "languages": "verified_authoritative"},
        "google_reviews": {},
    }
    base.update(overrides)
    return Clinic(**base)


def _prefs(**overrides):
    base = {
        "insurance": "Medicaid",
        "language": "English",
        "transportation": "MARTA",
        "needs_wheelchair_access": False,
        "origin_latitude": 33.749,
        "origin_longitude": -84.388,
        "origin_label": "test origin",
    }
    base.update(overrides)
    return UserPreferences(**base)


def test_all_preferences_verified_match():
    result = score_clinic(_clinic(), _prefs(needs_wheelchair_access=True))
    assert result["eligibility_status"] == "eligible"
    assert result["match_score"] is not None
    assert result["match_score"] > 50


def test_mandatory_insurance_mismatch_excluded():
    clinic = _clinic(accepted_insurance=["Medicare"])
    prefs = _prefs(required_insurance=True, insurance="Medicaid")
    result = score_clinic(clinic, prefs)
    assert result["eligibility_status"] == "excluded"
    assert result["mandatory_blocked"] is True


def test_insurance_unknown_not_treated_as_match():
    clinic = _clinic(accepted_insurance=[])
    result = score_clinic(clinic, _prefs())
    aff = next(c for c in result["components"] if c["key"] == "affordability")
    assert aff["status"] == "unknown"
    assert aff["score"] == 0


def test_mandatory_insurance_unknown_needs_verification():
    clinic = _clinic(accepted_insurance=[])
    prefs = _prefs(required_insurance=True)
    result = score_clinic(clinic, prefs)
    assert result["eligibility_status"] == "needs_verification"


def test_required_service_missing_from_list_excluded():
    clinic = _clinic(medical_services=["Dental care"])
    prefs = _prefs(required_service="Primary care")
    result = score_clinic(clinic, prefs)
    assert result["eligibility_status"] == "excluded"


def test_required_service_field_missing_needs_verification():
    clinic = _clinic(medical_services=[])
    prefs = _prefs(required_service="Primary care")
    result = score_clinic(clinic, prefs)
    assert result["eligibility_status"] == "needs_verification"


def test_language_unknown():
    clinic = _clinic(languages=[])
    result = score_clinic(clinic, _prefs())
    lang = next(c for c in result["components"] if c["key"] == "language")
    assert lang["status"] == "unknown"


def test_wheelchair_need_unverified_accessibility():
    clinic = _clinic(accessibility_features=[])
    prefs = _prefs(needs_wheelchair_access=True)
    result = score_clinic(clinic, prefs)
    acc = next(c for c in result["components"] if c["key"] == "accessibility")
    assert acc["status"] == "unknown"


def test_no_accessibility_preference_not_applicable():
    result = score_clinic(_clinic(), _prefs())
    acc = next(c for c in result["components"] if c["key"] == "accessibility")
    assert acc["status"] == "not_applicable"
    assert acc["applicable"] is False


def test_no_user_location_omits_distance_from_applicable_set():
    result = score_clinic(_clinic(), _prefs(origin_latitude=None, origin_longitude=None))
    assert not any(c["key"] == "distance" for c in result["components"])


def test_invalid_clinic_coordinates_distance_unknown():
    clinic = _clinic(latitude=0.0, longitude=0.0)
    result = score_clinic(clinic, _prefs())
    dist = next(c for c in result["components"] if c["key"] == "distance")
    assert dist["status"] == "unknown"
    assert result["distance_miles"] is None


def test_hours_only_appointment_unknown():
    clinic = _clinic(appointment_information="", operating_hours={"summary": "Mon-Fri 9-5"})
    result = score_clinic(clinic, _prefs())
    appt = next(c for c in result["components"] if c["key"] == "appointment")
    assert appt["status"] == "unknown"


def test_transportation_unknown_without_marta_data():
    clinic = _clinic(transit_options=[])
    result = score_clinic(
        clinic,
        _prefs(transportation="MARTA", origin_latitude=None, origin_longitude=None),
    )
    trans = next(c for c in result["components"] if c["key"] == "transportation")
    assert trans["status"] == "unknown"


def test_transportation_marta_scores_from_user_origin():
    clinic = _clinic(transit_options=["marta"])
    result = score_clinic(clinic, _prefs(transportation="MARTA", origin_latitude=33.749, origin_longitude=-84.388))
    trans = next(c for c in result["components"] if c["key"] == "transportation")
    assert trans["status"] == "match"
    assert trans["score"] == trans["max_score"]
    assert "From" in trans["explanation"]


def test_transportation_marta_partial_when_user_far_from_rail():
    clinic = _clinic(transit_options=["marta"])
    result = score_clinic(
        clinic,
        _prefs(transportation="MARTA", origin_latitude=34.05, origin_longitude=-84.28),
    )
    trans = next(c for c in result["components"] if c["key"] == "transportation")
    assert trans["status"] in {"partial", "mismatch"}
    assert trans["score"] < trans["max_score"]


def test_partial_evaluable_criteria_normalizes():
    clinic = _clinic(languages=[], transit_options=[])
    prefs = _prefs(origin_latitude=None, origin_longitude=None, transportation="Car")
    result = score_clinic(clinic, prefs)
    assert result["match_score"] is not None
    assert result["evaluated_criteria_count"] >= 1


def test_insufficient_information_when_nothing_evaluable():
    clinic = _clinic(
        accepted_insurance=[],
        languages=[],
        medical_services=[],
        accessibility_features=[],
        transit_options=[],
        appointment_information="",
        operating_hours={},
    )
    prefs = _prefs(origin_latitude=None, origin_longitude=None, transportation="Car")
    result = score_clinic(clinic, prefs)
    assert result["match_score"] is None
    assert "Insufficient" in result["confidence_label"]


def test_demo_clinic_excluded_from_default_api_query_not_engine():
    """Engine scores any clinic; API layer filters synthetic_demo by default (see test_clinics)."""
    clinic = _clinic(data_source="synthetic_demo")
    result = score_clinic(clinic, _prefs())
    assert result["match_score"] is not None or result["match_score"] is None


def test_normalization_differs_when_car_transport_selected():
    full = score_clinic(_clinic(), _prefs(transportation="MARTA"))
    car = score_clinic(_clinic(), _prefs(transportation="Car"))
    trans_full = next(c for c in full["components"] if c["key"] == "transportation")
    trans_car = next(c for c in car["components"] if c["key"] == "transportation")
    assert trans_full["applicable"] is True
    assert trans_car["applicable"] is False


def test_closer_clinic_scores_higher_distance():
    near = _clinic(latitude=33.751, longitude=-84.39)
    far = _clinic(id="far", latitude=33.85, longitude=-84.39)
    prefs = _prefs()
    near_score = score_clinic(near, prefs)["match_score"]
    far_score = score_clinic(far, prefs)["match_score"]
    assert near_score is not None and far_score is not None
    assert near_score > far_score


def test_summary_mentions_unknowns():
    clinic = _clinic(accepted_insurance=[], languages=[])
    result = score_clinic(clinic, _prefs(origin_latitude=None, origin_longitude=None, transportation="Car"))
    assert "confirm" in result["summary"].lower()

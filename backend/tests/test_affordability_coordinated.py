from app.matching.engine import score_clinic
from app.matching.types import UserPreferences
from app.models import Clinic


def _clinic(**overrides):
    base = {
        "id": "c1",
        "name": "Test",
        "organization_name": "Org",
        "description": "x",
        "address": "1 St",
        "city": "Atlanta",
        "state": "GA",
        "postal_code": "30303",
        "latitude": 33.75,
        "longitude": -84.39,
        "phone": "",
        "website": None,
        "facility_type": "fqhc",
        "medical_services": ["Primary care", "Behavioral health", "Specialist referrals"],
        "accepted_insurance": ["Medicaid", "Self-pay"],
        "languages": ["English"],
        "accessibility_features": [],
        "transit_options": [],
        "operating_hours": {},
        "appointment_information": "",
        "data_source": "hrsa_hcsd",
        "record_status": "active",
        "data_completeness_score": 0,
        "field_verification": {
            "accepted_insurance": "inferred_hrsa_program",
            "medical_services": "verified_authoritative",
            "affordability_structured": {
                "sliding_scale": True,
                "affordable_self_pay": True,
                "source": "inferred_hrsa_program",
            },
        },
    }
    base.update(overrides)
    return Clinic(**base)


def _prefs(**kwargs):
    defaults = {
        "insurance": "Medicaid",
        "language": "English",
        "transportation": "Car",
        "needs_wheelchair_access": False,
        "cost_is_barrier": False,
        "prioritize_coordinated_care": True,
    }
    defaults.update(kwargs)
    return UserPreferences(**defaults)


def test_cost_barrier_boosts_sliding_scale_hrsa():
    clinic = _clinic()
    without = score_clinic(clinic, _prefs(cost_is_barrier=False))
    with_barrier = score_clinic(clinic, _prefs(cost_is_barrier=True))
    aff_without = next(c for c in without["components"] if c["key"] == "affordability")
    aff_with = next(c for c in with_barrier["components"] if c["key"] == "affordability")
    assert aff_with["status"] == "match"
    assert aff_with["score"] >= aff_without["score"]


def test_coordinated_care_scores_multi_service_referrals():
    clinic = _clinic()
    result = score_clinic(clinic, _prefs())
    coord = next(c for c in result["components"] if c["key"] == "coordinated_care")
    assert coord["status"] == "match"
    assert coord["score"] > 0


def test_coordinated_care_not_applicable_when_disabled():
    clinic = _clinic()
    result = score_clinic(clinic, _prefs(prioritize_coordinated_care=False))
    coord = next(c for c in result["components"] if c["key"] == "coordinated_care")
    assert coord["applicable"] is False

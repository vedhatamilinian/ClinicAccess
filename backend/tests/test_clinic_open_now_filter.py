from unittest.mock import patch

from app.models import Clinic
from app.services.clinic_service import clinic_is_open_now


def _clinic(**overrides) -> Clinic:
    base = {
        "id": "boh-test-open",
        "name": "Test BOH Site",
        "organization_name": "BOH",
        "description": "Test",
        "address": "1 Main St",
        "city": "Atlanta",
        "state": "GA",
        "postal_code": "30303",
        "latitude": 33.75,
        "longitude": -84.39,
        "medical_services": ["Primary care"],
        "accepted_insurance": ["Medicaid"],
        "languages": ["English"],
        "data_source": "fulton_boh",
        "operating_hours": {"summary": "Mon–Fri: 8:00 a.m.–4:30 p.m."},
    }
    base.update(overrides)
    return Clinic(**base)


def test_clinic_is_open_now_uses_derived_hours():
    clinic = _clinic()
    with patch("app.importers.hours_open.is_open_from_hours_summary", return_value=True):
        assert clinic_is_open_now(clinic) is True
    with patch("app.importers.hours_open.is_open_from_hours_summary", return_value=False):
        assert clinic_is_open_now(clinic) is False


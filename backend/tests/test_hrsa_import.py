from pathlib import Path

from app.importers.hrsa import iter_fulton_clinic_payloads

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "hrsa_sample.csv"


def test_import_fulton_rows_from_fixture():
    payloads, stats = iter_fulton_clinic_payloads(FIXTURE)
    assert stats.rows_read == 3
    assert stats.fulton_rows == 2
    assert stats.imported == 2
    assert all(item["data_source"] == "hrsa_hcsd" for item in payloads)
    assert all(item["accepted_insurance"] == ["Medicaid", "Medicare", "Self-pay"] for item in payloads)
    assert all(item["languages"] == [] for item in payloads)
    assert all(len(item["transit_options"]) > 0 for item in payloads)
    assert payloads[0]["name"] == "Adamsville Site"
    assert payloads[0]["phone"] == "404-555-0100"

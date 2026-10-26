from datetime import datetime
from zoneinfo import ZoneInfo

from app.importers.hours_open import enrich_operating_hours, is_open_from_hours_summary

TZ = ZoneInfo("America/New_York")


def test_weekday_during_boh_hours_open():
    when = datetime(2026, 3, 23, 10, 0, tzinfo=TZ)  # Monday 10am
    summary = "Mon–Fri: 8:00 a.m.–12:00 p.m. & 1:00 p.m.–4:30 p.m."
    assert is_open_from_hours_summary(summary, when) is True


def test_weekday_outside_hours_closed():
    when = datetime(2026, 3, 23, 18, 0, tzinfo=TZ)  # Monday 6pm
    summary = "Mon–Fri: 8:00 a.m.–12:00 p.m. & 1:00 p.m.–4:30 p.m."
    assert is_open_from_hours_summary(summary, when) is False


def test_weekend_closed_for_mon_fri_summary():
    when = datetime(2026, 3, 22, 10, 0, tzinfo=TZ)  # Sunday
    summary = "Mon–Fri: 8:00 a.m.–4:30 p.m."
    assert is_open_from_hours_summary(summary, when) is False


def test_enrich_adds_open_now_when_missing():
    enriched = enrich_operating_hours({"summary": "Mon–Fri: 8:00 a.m.–4:30 p.m."})
    assert "open_now" in enriched
    assert enriched.get("open_now_source") == "derived_hours_summary"

"""Best-effort open-now from published hours text (America/New_York). Not real-time verification."""

from __future__ import annotations

import re
from datetime import datetime
from zoneinfo import ZoneInfo

ATLANTA_TZ = ZoneInfo("America/New_York")

_TIME_RANGE = re.compile(
    r"(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)\s*[–\-]\s*(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)",
    re.IGNORECASE,
)


def _to_minutes(hour: int, minute: int, meridiem: str) -> int:
    mer = meridiem.lower().replace(".", "")
    if mer.startswith("p") and hour != 12:
        hour += 12
    if mer.startswith("a") and hour == 12:
        hour = 0
    return hour * 60 + minute


def _parse_ranges(summary: str) -> list[tuple[int, int]]:
    ranges: list[tuple[int, int]] = []
    for match in _TIME_RANGE.finditer(summary):
        sh, sm, sampm, eh, em, eampm = match.groups()
        start = _to_minutes(int(sh), int(sm or 0), sampm)
        end = _to_minutes(int(eh), int(em or 0), eampm)
        if end > start:
            ranges.append((start, end))
    return ranges


def is_open_from_hours_summary(summary: str, when: datetime | None = None) -> bool | None:
    if not summary or not summary.strip():
        return None
    now = when or datetime.now(ATLANTA_TZ)
    if now.tzinfo is None:
        now = now.replace(tzinfo=ATLANTA_TZ)
    else:
        now = now.astimezone(ATLANTA_TZ)

    text = summary.lower()
    dow = now.weekday()

    if "mon" in text and "fri" in text and "sat" not in text and "sun" not in text and "every day" not in text:
        if dow >= 5:
            return False

    if "every day" in text or "daily" in text:
        pass
    elif "sat" in text and dow == 5:
        pass
    elif dow >= 5 and "mon" in text and "fri" in text:
        return False

    ranges = _parse_ranges(summary)
    if not ranges:
        return None

    current = now.hour * 60 + now.minute
    return any(start <= current <= end for start, end in ranges)


def enrich_operating_hours(operating_hours: dict | None) -> dict:
    if not operating_hours:
        return {}
    if "open_now" in operating_hours:
        return operating_hours
    summary = operating_hours.get("summary")
    if not isinstance(summary, str):
        return operating_hours
    derived = is_open_from_hours_summary(summary)
    if derived is None:
        return operating_hours
    return {
        **operating_hours,
        "open_now": derived,
        "open_now_source": "derived_hours_summary",
    }

"""Backward-compatible entry point — implementation lives in app.matching."""

from app.matching.engine import score_clinic
from app.matching.types import UserPreferences

__all__ = ["score_clinic", "UserPreferences"]

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal

EligibilityStatus = Literal["eligible", "excluded", "needs_verification"]
CriterionStatus = Literal["match", "partial", "mismatch", "unknown", "not_applicable"]


@dataclass
class UserPreferences:
    insurance: str
    language: str
    transportation: str = "Car"
    needs_wheelchair_access: bool = False
    origin_latitude: float | None = None
    origin_longitude: float | None = None
    origin_label: str | None = None
    required_insurance: bool = False
    required_language: bool = False
    required_service: str | None = None
    # Structured accessibility needs (subset scored when user selects them).
    needs_accessible_entrance: bool = False
    needs_accessible_restroom: bool = False
    needs_hearing_accommodation: bool = False
    cost_is_barrier: bool = False
    prioritize_coordinated_care: bool = True


@dataclass
class CriterionResult:
    key: str
    label: str
    score: float
    max_score: float
    status: CriterionStatus
    explanation: str | None = None
    source: str | None = None
    applicable: bool = True

    def to_dict(self) -> dict[str, Any]:
        return {
            "key": self.key,
            "label": self.label,
            "score": round(self.score, 1),
            "max_score": round(self.max_score, 1),
            "status": self.status,
            "explanation": self.explanation,
            "source": self.source,
            "applicable": self.applicable,
        }


@dataclass
class MatchResult:
    eligibility_status: EligibilityStatus
    match_score: float | None
    data_completeness: int
    confidence_label: str
    distance_miles: float | None
    distance_is_estimate: bool
    mandatory_blocked: bool
    reasons: list[str] = field(default_factory=list)
    barriers: list[str] = field(default_factory=list)
    unknown_fields: list[str] = field(default_factory=list)
    components: list[CriterionResult] = field(default_factory=list)
    evaluated_criteria_count: int = 0
    unknown_criteria_count: int = 0
    summary: str = ""

    def to_scoring_dict(self) -> dict[str, Any]:
        return {
            "eligibility_status": self.eligibility_status,
            "match_score": self.match_score,
            "data_completeness": self.data_completeness,
            "confidence_label": self.confidence_label,
            "distance_miles": self.distance_miles,
            "distance_is_estimate": self.distance_is_estimate,
            "mandatory_blocked": self.mandatory_blocked,
            "reasons": self.reasons,
            "barriers": self.barriers,
            "unknown_fields": self.unknown_fields,
            "components": [c.to_dict() for c in self.components],
            "evaluated_criteria_count": self.evaluated_criteria_count,
            "unknown_criteria_count": self.unknown_criteria_count,
            "summary": self.summary,
        }

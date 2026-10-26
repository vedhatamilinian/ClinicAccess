"""Two-stage matching: mandatory eligibility, then preference scoring."""

from __future__ import annotations

from app.matching import clinic_data as cd
from app.matching.config import (
    APPOINTMENT_INFO_STALE_DAYS,
    MAX_DISTANCE_MILES,
    PREFERRED_DISTANCE_MILES,
    weights_for_preferences,
)
from app.matching.coordinated_care import coordinated_care_signals
from app.matching.geo import haversine_miles, valid_coordinate
from app.matching.marta_origin_scoring import score_marta_transportation_from_origin
from app.matching.types import CriterionResult, CriterionStatus, MatchResult, UserPreferences
from app.models import Clinic
from app.services.clinic_quality import compute_completeness

PRIVATE_INSURANCE = "Private insurance"


def _confidence_label(
    match_score: float | None,
    completeness: int,
    eligibility_status: str,
) -> str:
    if eligibility_status == "needs_verification":
        return "Needs verification"
    if match_score is None:
        return "Insufficient information to rank"
    if completeness < 40:
        return "Limited information"
    if match_score >= 85:
        return "Strong match (known data)"
    if match_score >= 65:
        return "Moderate match"
    return "Limited match"


def _evaluate_mandatory(clinic: Clinic, prefs: UserPreferences) -> tuple[str, list[str], list[str], bool]:
    """
    Returns eligibility_status, barriers, unknown_fields, mandatory_blocked.
    excluded = confirmed mandatory failure; needs_verification = cannot confirm requirement.
    """
    barriers: list[str] = []
    unknowns: list[str] = []
    excluded = False
    needs_verification = False

    if prefs.required_service:
        required = prefs.required_service.strip().lower()
        services = cd.services_list(clinic)
        if not services:
            unknowns.append("medical_services")
            barriers.append(f"Cannot verify required service: {prefs.required_service}.")
            needs_verification = True
        elif not any(required in s.lower() for s in services):
            barriers.append(f"Required service not listed: {prefs.required_service}.")
            excluded = True

    if prefs.required_insurance:
        plans = cd.insurance_list(clinic)
        if not plans:
            unknowns.append("accepted_insurance")
            barriers.append("Insurance acceptance not listed , cannot confirm your plan.")
            needs_verification = True
        elif cd.is_inferred(clinic, "accepted_insurance"):
            unknowns.append("accepted_insurance")
            barriers.append("Insurance list is program-typical (inferred), not site-verified.")
            needs_verification = True
        elif prefs.insurance not in plans:
            if prefs.insurance == PRIVATE_INSURANCE:
                unknowns.append("accepted_insurance")
                barriers.append("Private/commercial insurance is not listed in source data.")
                needs_verification = True
            else:
                barriers.append("Does not list your insurance plan.")
                excluded = True

    if prefs.required_language:
        langs = cd.language_list(clinic)
        if not langs:
            unknowns.append("languages")
            barriers.append("Languages not listed , cannot confirm your language.")
            needs_verification = True
        elif prefs.language not in langs:
            if prefs.language == "Other":
                unknowns.append("languages")
                barriers.append("Your language is not a preset option; confirm language access with the clinic.")
                needs_verification = True
            else:
                barriers.append(f"Does not list {prefs.language}.")
                excluded = True

    if excluded:
        return "excluded", barriers, unknowns, True
    if needs_verification:
        return "needs_verification", barriers, unknowns, True
    return "eligible", barriers, unknowns, False


def _score_distance(clinic: Clinic, prefs: UserPreferences, weights) -> tuple[CriterionResult | None, float | None]:
    if prefs.origin_latitude is None or prefs.origin_longitude is None:
        return None, None
    if not valid_coordinate(clinic.latitude, clinic.longitude):
        return (
            CriterionResult(
                "distance",
                "Distance",
                0.0,
                weights.distance,
                "unknown",
                explanation="Clinic coordinates are missing or invalid.",
                applicable=True,
            ),
            None,
        )
    miles = haversine_miles(
        prefs.origin_latitude,
        prefs.origin_longitude,
        clinic.latitude,
        clinic.longitude,
    )
    ratio = max(0.0, 1.0 - miles / MAX_DISTANCE_MILES)
    score = weights.distance * ratio
    label = prefs.origin_label or "your selected location"
    explanation = (
        f"About {miles:.1f} straight-line miles from {label} (estimate, not driving or transit time)."
    )
    return (
        CriterionResult(
            "distance",
            "Distance",
            round(score, 1),
            weights.distance,
            "match" if miles <= PREFERRED_DISTANCE_MILES else "partial",
            explanation=explanation,
            source="haversine_estimate",
        ),
        miles,
    )


def _affordability_source(blob: dict) -> str | None:
    source = blob.get("source")
    return str(source) if source else None


def _score_affordability(clinic: Clinic, prefs: UserPreferences, weights) -> CriterionResult:
    blob = cd.affordability_blob(clinic)
    plans = cd.insurance_list(clinic)
    verification = cd.field_verification(clinic, "accepted_insurance")
    structured_source = _affordability_source(blob)
    max_pts = weights.affordability

    verified_sliding = bool(blob.get("sliding_scale")) and structured_source not in (None, "inferred_hrsa_program")
    inferred_sliding = bool(blob.get("sliding_scale")) and structured_source == "inferred_hrsa_program"
    free_care = bool(blob.get("free_care"))
    affordable_self_pay = bool(blob.get("affordable_self_pay")) or "Self-pay" in plans
    financial_assistance = bool(blob.get("financial_assistance"))

    if prefs.cost_is_barrier:
        if free_care:
            return CriterionResult(
                "affordability",
                "Affordability",
                max_pts,
                max_pts,
                "match",
                explanation="Documents free or no-cost services for eligible visits , confirm eligibility with the site.",
                source=structured_source or verification or "structured",
            )
        if verified_sliding or financial_assistance:
            parts = []
            if verified_sliding:
                parts.append("verified sliding-scale fees")
            if financial_assistance:
                parts.append("financial assistance")
            return CriterionResult(
                "affordability",
                "Affordability",
                max_pts,
                max_pts,
                "match",
                explanation=f"Cost barrier priority: {', '.join(parts)} documented.",
                source=structured_source or verification or "structured",
            )
        if inferred_sliding:
            return CriterionResult(
                "affordability",
                "Affordability",
                max_pts,
                max_pts,
                "match",
                explanation="HRSA health center , sliding-scale fees are standard; confirm your fee with the site.",
                source=structured_source or "inferred_hrsa_program",
            )
        if affordable_self_pay and "Self-pay" in prefs.insurance:
            return CriterionResult(
                "affordability",
                "Affordability",
                max_pts,
                max_pts,
                "match",
                explanation="Self-pay and affordable payment options are documented , confirm current fees.",
                source=structured_source or verification,
            )
        if prefs.insurance in plans and not cd.is_inferred(clinic, "accepted_insurance"):
            return CriterionResult(
                "affordability",
                "Affordability",
                max_pts,
                max_pts,
                "match",
                explanation=f"Lists your plan ({prefs.insurance}) from verified data , confirm copays and sliding fees.",
                source=verification or "verified",
            )
        if prefs.insurance in plans and inferred_sliding:
            return CriterionResult(
                "affordability",
                "Affordability",
                round(max_pts * 0.85, 1),
                max_pts,
                "partial",
                explanation=f"Program-typical {prefs.insurance} acceptance with sliding-scale expectation , verify cost before visiting.",
                source=structured_source or "inferred_hrsa_program",
            )

    if blob.get("sliding_scale") or financial_assistance:
        parts = []
        if blob.get("sliding_scale"):
            parts.append("sliding-scale fees documented")
        if financial_assistance:
            parts.append("financial assistance documented")
        if free_care:
            parts.append("free care for eligible services")
        return CriterionResult(
            "affordability",
            "Affordability",
            max_pts,
            max_pts,
            "match",
            explanation=f"Affordability features: {', '.join(parts)}.",
            source=structured_source or verification or "structured",
        )

    if not plans:
        return CriterionResult(
            "affordability",
            "Affordability",
            0.0,
            max_pts,
            "unknown",
            explanation="Cost and insurance acceptance are not listed , contact the clinic.",
            source=verification,
        )

    if cd.is_inferred(clinic, "accepted_insurance"):
        if inferred_sliding and prefs.cost_is_barrier:
            return CriterionResult(
                "affordability",
                "Affordability",
                round(max_pts * 0.7, 1),
                max_pts,
                "partial",
                explanation="FQHC sliding-scale fees expected (program data) , confirm your cost.",
                source="inferred_hrsa_program",
            )
        return CriterionResult(
            "affordability",
            "Affordability",
            0.0,
            max_pts,
            "unknown",
            explanation="Only program-typical insurance is known (inferred) , confirm fees and your plan.",
            source=verification,
        )

    if prefs.insurance in plans:
        return CriterionResult(
            "affordability",
            "Affordability",
            max_pts,
            max_pts,
            "match",
            explanation=f"Lists your insurance plan ({prefs.insurance}) from verified source data.",
            source=verification or "verified",
        )

    if prefs.insurance == PRIVATE_INSURANCE:
        return CriterionResult(
            "affordability",
            "Affordability",
            round(max_pts * 0.5, 1) if plans else 0.0,
            max_pts,
            "partial" if plans else "unknown",
            explanation="Private/commercial insurance is not listed in source data , confirm your plan with the clinic.",
            source=verification,
        )

    return CriterionResult(
        "affordability",
        "Affordability",
        0.0,
        max_pts,
        "mismatch",
        explanation=f"Does not list {prefs.insurance} in verified insurance data.",
        source=verification,
    )


def _score_coordinated_care(clinic: Clinic, prefs: UserPreferences, weights) -> CriterionResult | None:
    if not prefs.prioritize_coordinated_care:
        return CriterionResult(
            "coordinated_care",
            "Coordinated care",
            0.0,
            weights.coordinated_care,
            "not_applicable",
            explanation="Coordinated-care ranking is off in your preferences.",
            applicable=False,
        )

    services = cd.services_list(clinic)
    count, has_pathway, pathways = coordinated_care_signals(services)
    source = cd.field_verification(clinic, "medical_services") or "unknown"
    max_pts = weights.coordinated_care

    if not services:
        return CriterionResult(
            "coordinated_care",
            "Coordinated care",
            0.0,
            max_pts,
            "unknown",
            explanation="Services are not listed , ask whether referrals or multiple programs are available.",
            source=source,
        )

    if count >= 2 and has_pathway:
        labels = ", ".join(pathways[:4])
        return CriterionResult(
            "coordinated_care",
            "Coordinated care",
            max_pts,
            max_pts,
            "match",
            explanation=f"Offers {count} listed services with referral-style care ({labels}).",
            source=source,
        )

    if count >= 2:
        return CriterionResult(
            "coordinated_care",
            "Coordinated care",
            round(max_pts * 0.75, 1),
            max_pts,
            "partial",
            explanation=f"Lists {count} services on site , confirm referral pathways with the clinic.",
            source=source,
        )

    if has_pathway:
        return CriterionResult(
            "coordinated_care",
            "Coordinated care",
            round(max_pts * 0.6, 1),
            max_pts,
            "partial",
            explanation="Documents referral or specialty pathways , may be a single primary entry point.",
            source=source,
        )

    return CriterionResult(
        "coordinated_care",
        "Coordinated care",
        round(max_pts * 0.25, 1),
        max_pts,
        "partial",
        explanation="Primarily one listed service , other care may require a separate referral.",
        source=source,
    )


def _appointment_stale(clinic: Clinic) -> bool:
    days = cd.days_since_verified(clinic)
    return days is not None and days > APPOINTMENT_INFO_STALE_DAYS


def _score_appointment(clinic: Clinic, weights) -> CriterionResult:
    blob = cd.appointment_blob(clinic)
    appt_text = (clinic.appointment_information or "").strip()
    hours = clinic.operating_hours or {}

    if blob.get("accepting_new_patients") is True:
        return CriterionResult(
            "appointment",
            "Appointment availability",
            weights.appointment,
            weights.appointment,
            "match",
            explanation="Documented as accepting new patients.",
            source="structured",
        )
    if blob.get("accepting_new_patients") is False:
        return CriterionResult(
            "appointment",
            "Appointment availability",
            0.0,
            weights.appointment,
            "mismatch",
            explanation="Documented as not accepting new patients.",
            source="structured",
        )
    if blob.get("online_scheduling"):
        return CriterionResult(
            "appointment",
            "Appointment availability",
            weights.appointment * 0.8,
            weights.appointment,
            "partial",
            explanation="Online scheduling is documented.",
            source="structured",
        )

    if appt_text and not _appointment_stale(clinic):
        return CriterionResult(
            "appointment",
            "Appointment availability",
            weights.appointment * 0.4,
            weights.appointment,
            "partial",
            explanation="Scheduling notes are available but new-patient status is not confirmed.",
            source="appointment_information",
        )

    if hours.get("summary") and not appt_text:
        return CriterionResult(
            "appointment",
            "Appointment availability",
            0.0,
            weights.appointment,
            "unknown",
            explanation="Only opening hours are known , not the same as appointment availability.",
            source="operating_hours",
        )

    return CriterionResult(
        "appointment",
        "Appointment availability",
        0.0,
        weights.appointment,
        "unknown",
        explanation="Appointment and new-patient information is not available.",
    )


def _score_language(clinic: Clinic, prefs: UserPreferences, weights) -> CriterionResult:
    langs = cd.language_list(clinic)
    if not langs:
        return CriterionResult(
            "language",
            "Language",
            0.0,
            weights.language,
            "unknown",
            explanation="Languages are not listed , ask about interpreter services.",
        )
    if prefs.language == "Other":
        if any("interpreter" in lang.lower() for lang in langs):
            return CriterionResult(
                "language",
                "Language",
                weights.language * 0.6,
                weights.language,
                "partial",
                explanation="Interpreter services are mentioned; confirm your language with the clinic.",
                source=cd.field_verification(clinic, "languages"),
            )
        if len(langs) >= 2:
            return CriterionResult(
                "language",
                "Language",
                weights.language * 0.4,
                weights.language,
                "partial",
                explanation="Multiple languages are listed; confirm your language with the clinic.",
                source=cd.field_verification(clinic, "languages"),
            )
        return CriterionResult(
            "language",
            "Language",
            0.0,
            weights.language,
            "unknown",
            explanation="Language access for your needs is not confirmed in available data.",
            source=cd.field_verification(clinic, "languages"),
        )
    if prefs.language in langs:
        return CriterionResult(
            "language",
            "Language",
            weights.language,
            weights.language,
            "match",
            explanation=f"Lists {prefs.language} among supported languages.",
            source=cd.field_verification(clinic, "languages"),
        )
    if any("interpreter" in lang.lower() for lang in langs):
        return CriterionResult(
            "language",
            "Language",
            weights.language * 0.5,
            weights.language,
            "partial",
            explanation="Interpreter services are mentioned; direct support for your language is not confirmed.",
        )
    return CriterionResult(
        "language",
        "Language",
        0.0,
        weights.language,
        "mismatch",
        explanation=f"Does not list {prefs.language}.",
    )


def _accessibility_needs(prefs: UserPreferences) -> list[tuple[str, str, bool]]:
    needs: list[tuple[str, str, bool]] = []
    if prefs.needs_wheelchair_access or prefs.needs_accessible_entrance:
        needs.append(("wheelchair_accessible", "Wheelchair-accessible entrance", True))
    if prefs.needs_accessible_restroom:
        needs.append(("accessible_restroom", "Accessible restroom", True))
    if prefs.needs_hearing_accommodation:
        needs.append(("hearing_accommodation", "Hearing-related accommodation", True))
    return needs


def _score_accessibility(clinic: Clinic, prefs: UserPreferences, weights) -> CriterionResult | None:
    needs = _accessibility_needs(prefs)
    if not needs:
        return CriterionResult(
            "accessibility",
            "Accessibility",
            0.0,
            weights.accessibility,
            "not_applicable",
            explanation="No accessibility preferences selected.",
            applicable=False,
        )

    if not cd.accessibility_feature_known(clinic):
        return CriterionResult(
            "accessibility",
            "Accessibility",
            0.0,
            weights.accessibility,
            "unknown",
            explanation="Accessibility features are not listed , call the clinic before visiting.",
        )

    matched = 0
    unknown = 0
    for feature, label, _ in needs:
        if cd.has_feature(clinic, feature):
            matched += 1
        else:
            unknown += 1

    if matched == len(needs):
        status: CriterionStatus = "match"
        score = weights.accessibility
        explanation = "Documented accessibility features match your selected needs."
    elif matched > 0:
        status = "partial"
        score = weights.accessibility * (matched / len(needs))
        explanation = "Some documented accessibility features match; others are not confirmed."
    else:
        status = "mismatch"
        score = 0.0
        explanation = "Listed accessibility features do not include your selected needs."

    return CriterionResult(
        "accessibility",
        "Accessibility",
        round(score, 1),
        weights.accessibility,
        status,
        explanation=explanation,
        source=cd.field_verification(clinic, "accessibility_features"),
    )


def _score_transportation(clinic: Clinic, prefs: UserPreferences, weights) -> CriterionResult | None:
    if prefs.transportation not in {"MARTA", "Walking", "Car"}:
        return None

    options = clinic.transit_options or []
    verification = cd.field_verification(clinic, "transit_options")

    if prefs.transportation == "Car":
        return CriterionResult(
            "transportation",
            "Transportation",
            0.0,
            weights.transportation,
            "not_applicable",
            explanation="Driving access is not scored , use distance instead.",
            applicable=False,
        )

    if prefs.transportation == "MARTA" and valid_coordinate(prefs.origin_latitude, prefs.origin_longitude):
        return score_marta_transportation_from_origin(clinic, prefs, weights.transportation, verification)

    if not options and prefs.transportation == "MARTA":
        return CriterionResult(
            "transportation",
            "Transportation",
            0.0,
            weights.transportation,
            "unknown",
            explanation="Public transit proximity is not documented for this clinic.",
        )

    if prefs.transportation == "Walking":
        return CriterionResult(
            "transportation",
            "Transportation",
            0.0,
            weights.transportation,
            "not_applicable",
            explanation="Walking access is reflected in distance scoring when location is provided.",
            applicable=False,
        )

    if "marta" in options:
        return CriterionResult(
            "transportation",
            "Transportation",
            weights.transportation,
            weights.transportation,
            "match",
            explanation="Within ~0.75 mi of a MARTA rail station (MARTA GTFS, straight-line).",
            source=verification or "marta_gtfs",
        )

    if "marta_bus" in options:
        return CriterionResult(
            "transportation",
            "Transportation",
            weights.transportation,
            weights.transportation,
            "match",
            explanation="Within ~0.25 mi of a MARTA bus stop (MARTA GTFS, straight-line).",
            source=verification or "marta_gtfs",
        )

    if "rail_not_within_walking_distance" in options or "transit_not_within_walking_distance" in options:
        return CriterionResult(
            "transportation",
            "Transportation",
            0.0,
            weights.transportation,
            "mismatch",
            explanation="No MARTA rail or bus stop within walking distance per GTFS (straight-line).",
            source=verification or "marta_gtfs",
        )

    return CriterionResult(
        "transportation",
        "Transportation",
        0.0,
        weights.transportation,
        "unknown",
        explanation="Transit information is unavailable.",
    )


def _build_summary(
    prefs: UserPreferences,
    eligibility: str,
    match_score: float | None,
    components: list[CriterionResult],
    barriers: list[str],
) -> str:
    if eligibility == "excluded":
        return "Not recommended: " + (barriers[0] if barriers else "a mandatory requirement could not be met.")
    if match_score is None:
        return "Insufficient information to rank this clinic for your preferences. Contact the clinic to confirm details."

    unknowns = [c for c in components if c.applicable and c.status == "unknown"]
    parts: list[str] = []
    if eligibility == "needs_verification":
        parts.append("One or more essential requirements are not verified in available data.")
    if unknowns:
        parts.append(
            f"{len(unknowns)} preference area(s) could not be evaluated ({', '.join(c.label.lower() for c in unknowns[:3])})."
        )
    parts.append("Confirm insurance, appointments, and access before visiting.")
    return " ".join(parts)


def score_clinic(clinic: Clinic, preferences: UserPreferences) -> dict:
    weights = weights_for_preferences(preferences.cost_is_barrier)
    eligibility, barriers, unknown_fields, mandatory_blocked = _evaluate_mandatory(clinic, preferences)

    components: list[CriterionResult] = []
    reasons: list[str] = []

    distance_component, distance_miles = _score_distance(clinic, preferences, weights)
    if distance_component:
        components.append(distance_component)
        if distance_component.status in {"match", "partial"} and distance_miles is not None:
            if distance_miles <= PREFERRED_DISTANCE_MILES:
                reasons.append(distance_component.explanation or "")

    components.append(_score_affordability(clinic, preferences, weights))
    coordinated = _score_coordinated_care(clinic, preferences, weights)
    if coordinated:
        components.append(coordinated)
    components.append(_score_appointment(clinic, weights))
    components.append(_score_language(clinic, preferences, weights))

    acc = _score_accessibility(clinic, preferences, weights)
    if acc:
        components.append(acc)

    trans = _score_transportation(clinic, preferences, weights)
    if trans:
        components.append(trans)

    applicable = [c for c in components if c.applicable and c.status != "not_applicable"]
    evaluable = [c for c in applicable if c.status != "unknown"]
    unknown_criteria = [c for c in applicable if c.status == "unknown"]

    earned = sum(c.score for c in applicable)
    max_applicable = sum(c.max_score for c in applicable)

    if max_applicable <= 0 or not evaluable:
        match_score: float | None = None
    else:
        match_score = round((earned / max_applicable) * 100, 1)

    for c in components:
        if c.status == "match" and c.explanation and c.key not in {"distance"}:
            reasons.append(c.explanation)

    completeness = compute_completeness(clinic)
    summary = _build_summary(preferences, eligibility, match_score, components, barriers)

    return MatchResult(
        eligibility_status=eligibility,
        match_score=match_score,
        data_completeness=completeness,
        confidence_label=_confidence_label(match_score, completeness, eligibility),
        distance_miles=round(distance_miles, 1) if distance_miles is not None else None,
        distance_is_estimate=True,
        mandatory_blocked=mandatory_blocked,
        reasons=[r for r in reasons if r],
        barriers=barriers,
        unknown_fields=list(dict.fromkeys(unknown_fields + [c.key for c in unknown_criteria])),
        components=components,
        evaluated_criteria_count=len(evaluable),
        unknown_criteria_count=len(unknown_criteria),
        summary=summary,
    ).to_scoring_dict()

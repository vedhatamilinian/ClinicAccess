from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import RecommendationRequest, RecommendationResponse
from app.services.clinic_service import ClinicQuery, build_clinic_query, clinic_is_open_now, clinic_to_response
from app.matching.types import UserPreferences
from app.matching.engine import score_clinic

router = APIRouter(prefix="/api/v1", tags=["recommendations"])


@router.post("/recommendations", response_model=RecommendationResponse)
def recommend_clinics(payload: RecommendationRequest, db: Session = Depends(get_db)) -> RecommendationResponse:
    required_service = payload.preferences.required_service or payload.service
    filters = ClinicQuery(
        q=payload.q,
        service=payload.service,
        insurance=payload.insurance if payload.insurance_filter else None,
        language=payload.language if payload.language_filter else None,
        accessible=payload.accessible,
        transit=payload.transit,
        open_now=payload.open_now,
        city=payload.city,
        include_demo=payload.include_demo,
    )
    statement = build_clinic_query(filters)
    clinics = list(db.scalars(statement).all())
    if filters.open_now is True:
        clinics = [clinic for clinic in clinics if clinic_is_open_now(clinic)]
    if payload.clinic_ids:
        allowed = set(payload.clinic_ids)
        clinics = [c for c in clinics if c.id in allowed]

    preferences = UserPreferences(
        insurance=payload.preferences.insurance,
        language=payload.preferences.language,
        transportation=payload.preferences.transportation,
        needs_wheelchair_access=payload.preferences.needs_wheelchair_access,
        origin_latitude=payload.preferences.origin_latitude,
        origin_longitude=payload.preferences.origin_longitude,
        origin_label=payload.preferences.origin_label,
        required_insurance=payload.preferences.required_insurance,
        required_language=payload.preferences.required_language,
        required_service=required_service,
        needs_accessible_entrance=payload.preferences.needs_accessible_entrance
        or payload.preferences.needs_wheelchair_access,
        needs_accessible_restroom=payload.preferences.needs_accessible_restroom,
        needs_hearing_accommodation=payload.preferences.needs_hearing_accommodation,
        cost_is_barrier=payload.preferences.cost_is_barrier,
        prioritize_coordinated_care=payload.preferences.prioritize_coordinated_care,
    )

    items = []
    for clinic in clinics:
        scoring = score_clinic(clinic, preferences)
        if payload.exclude_excluded and scoring["eligibility_status"] == "excluded":
            continue
        if payload.exclude_mandatory_blocked and scoring["mandatory_blocked"]:
            continue
        items.append(
            {
                "clinic": clinic_to_response(clinic),
                **scoring,
            }
        )

    if payload.sort == "nearest":
        items.sort(
            key=lambda row: row["distance_miles"] if row["distance_miles"] is not None else float("inf"),
        )
    elif payload.sort == "alphabetical":
        items.sort(key=lambda row: row["clinic"]["name"])
    else:
        items.sort(
            key=lambda row: row["match_score"] if row["match_score"] is not None else -1.0,
            reverse=True,
        )

    return RecommendationResponse(items=items, total=len(items))

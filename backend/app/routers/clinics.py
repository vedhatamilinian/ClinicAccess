from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_admin_api_key
from app.schemas import ClinicCreate, ClinicResponse, ClinicUpdate, PaginatedClinicsResponse
from app.services.clinic_service import (
    ClinicQuery,
    clinic_to_response,
    create_clinic,
    delete_clinic,
    get_clinic,
    list_clinics,
    update_clinic,
)

router = APIRouter(prefix="/api/v1/clinics", tags=["clinics"])

MAX_PAGE_SIZE = 100


@router.get(
    "",
    response_model=PaginatedClinicsResponse,
    summary="List and search clinics",
    description=(
        "Combine filters with AND logic. Text search matches name, description, address, or city. "
        "All demonstration records use data_source=synthetic_demo and are not verified real-world data."
    ),
)
def get_clinics(
    q: str | None = Query(default=None, description="Search clinic name, description, or address"),
    service: str | None = Query(default=None, description="Medical service, exact match in list"),
    insurance: str | None = Query(default=None, description="Accepted insurance plan name"),
    language: str | None = Query(default=None, description="Spoken language"),
    accessible: bool | None = Query(default=None, description="Require wheelchair accessibility"),
    transit: bool | None = Query(default=None, description="Require public transit access"),
    open_now: bool | None = Query(default=None, description="Require clinics marked open now in demo data"),
    city: str | None = Query(default=None, description="City name"),
    include_demo: bool = Query(
        default=False,
        description="Include fictional synthetic_demo clinics (for development and testing only).",
    ),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=MAX_PAGE_SIZE),
    db: Session = Depends(get_db),
) -> PaginatedClinicsResponse:
    filters = ClinicQuery(
        q=q,
        service=service,
        insurance=insurance,
        language=language,
        accessible=accessible,
        transit=transit,
        open_now=open_now,
        city=city,
        include_demo=include_demo,
    )
    clinics, total = list_clinics(db, filters, page, page_size)
    return PaginatedClinicsResponse(
        items=[ClinicResponse(**clinic_to_response(clinic)) for clinic in clinics],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{clinic_id}", response_model=ClinicResponse, summary="Get clinic details")
def get_clinic_by_id(clinic_id: str, db: Session = Depends(get_db)) -> ClinicResponse:
    clinic = get_clinic(db, clinic_id)
    if not clinic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clinic not found")
    return ClinicResponse(**clinic_to_response(clinic))


@router.post(
    "",
    response_model=ClinicResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create clinic (admin development only)",
    dependencies=[Depends(require_admin_api_key)],
)
def create_clinic_route(payload: ClinicCreate, db: Session = Depends(get_db)) -> ClinicResponse:
    if get_clinic(db, payload.id):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Clinic id already exists")
    clinic = create_clinic(db, payload)
    return ClinicResponse(**clinic_to_response(clinic))


@router.patch(
    "/{clinic_id}",
    response_model=ClinicResponse,
    summary="Update clinic (admin development only)",
    dependencies=[Depends(require_admin_api_key)],
)
def update_clinic_route(
    clinic_id: str, payload: ClinicUpdate, db: Session = Depends(get_db)
) -> ClinicResponse:
    clinic = get_clinic(db, clinic_id)
    if not clinic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clinic not found")
    clinic = update_clinic(db, clinic, payload)
    return ClinicResponse(**clinic_to_response(clinic))


@router.delete(
    "/{clinic_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete clinic (admin development only)",
    dependencies=[Depends(require_admin_api_key)],
)
def delete_clinic_route(clinic_id: str, db: Session = Depends(get_db)) -> None:
    clinic = get_clinic(db, clinic_id)
    if not clinic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clinic not found")
    delete_clinic(db, clinic)

from sqlalchemy import Select, String, cast, func, or_, select
from sqlalchemy.orm import Session

from app.importers.hours_open import enrich_operating_hours
from app.models import Clinic
from app.schemas import ClinicCreate, ClinicUpdate


def clinic_is_open_now(clinic: Clinic) -> bool:
    """Match list/detail UI: derive open_now from stored hours when not persisted."""
    operating_hours = enrich_operating_hours(clinic.operating_hours or {})
    return operating_hours.get("open_now") is True


def clinic_to_response(clinic: Clinic) -> dict:
    data = {column.name: getattr(clinic, column.name) for column in clinic.__table__.columns}
    data["operating_hours"] = enrich_operating_hours(data.get("operating_hours") or {})
    data["is_synthetic_demo"] = clinic.data_source == "synthetic_demo"
    return data


class ClinicQuery:
    def __init__(
        self,
        q: str | None = None,
        service: str | None = None,
        insurance: str | None = None,
        language: str | None = None,
        accessible: bool | None = None,
        transit: bool | None = None,
        open_now: bool | None = None,
        city: str | None = None,
        include_demo: bool = False,
    ):
        self.q = q
        self.service = service
        self.insurance = insurance
        self.language = language
        self.accessible = accessible
        self.transit = transit
        self.open_now = open_now
        self.city = city
        self.include_demo = include_demo


def build_clinic_query(filters: ClinicQuery) -> Select[tuple[Clinic]]:
    statement: Select[tuple[Clinic]] = select(Clinic)

    if not filters.include_demo:
        statement = statement.where(
            Clinic.data_source.in_(["hrsa_hcsd", "fulton_boh"]),
            Clinic.record_status == "active",
        )

    if filters.q:
        pattern = f"%{filters.q.strip().lower()}%"
        statement = statement.where(
            or_(
                func.lower(Clinic.name).like(pattern),
                func.lower(Clinic.description).like(pattern),
                func.lower(Clinic.address).like(pattern),
                func.lower(Clinic.city).like(pattern),
            )
        )
    if filters.city:
        statement = statement.where(func.lower(Clinic.city) == filters.city.strip().lower())
    if filters.service:
        needle = f'%"{filters.service.strip()}"%'
        statement = statement.where(cast(Clinic.medical_services, String).ilike(needle))
    if filters.insurance:
        needle = f'%"{filters.insurance.strip()}"%'
        statement = statement.where(cast(Clinic.accepted_insurance, String).ilike(needle))
    if filters.language:
        needle = f'%"{filters.language.strip()}"%'
        statement = statement.where(cast(Clinic.languages, String).ilike(needle))
    if filters.accessible:
        statement = statement.where(cast(Clinic.accessibility_features, String).ilike('%"wheelchair_accessible"%'))
    if filters.transit:
        statement = statement.where(
            or_(
                cast(Clinic.transit_options, String).ilike('%"marta"%'),
                cast(Clinic.transit_options, String).ilike('%"public_transit"%'),
            )
        )
    return statement.order_by(Clinic.name.asc())


def _query_without_open_now(filters: ClinicQuery) -> ClinicQuery:
    return ClinicQuery(
        q=filters.q,
        service=filters.service,
        insurance=filters.insurance,
        language=filters.language,
        accessible=filters.accessible,
        transit=filters.transit,
        open_now=None,
        city=filters.city,
        include_demo=filters.include_demo,
    )


def list_clinics(db: Session, filters: ClinicQuery, page: int, page_size: int) -> tuple[list[Clinic], int]:
    if filters.open_now is True:
        base = build_clinic_query(_query_without_open_now(filters))
        open_rows = [clinic for clinic in db.scalars(base).all() if clinic_is_open_now(clinic)]
        total = len(open_rows)
        start = (page - 1) * page_size
        return open_rows[start : start + page_size], total

    base = build_clinic_query(filters)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    rows = db.scalars(base.offset((page - 1) * page_size).limit(page_size)).all()
    return list(rows), total


def get_clinic(db: Session, clinic_id: str) -> Clinic | None:
    return db.get(Clinic, clinic_id)


def create_clinic(db: Session, payload: ClinicCreate) -> Clinic:
    clinic = Clinic(**payload.model_dump())
    db.add(clinic)
    db.commit()
    db.refresh(clinic)
    return clinic


def update_clinic(db: Session, clinic: Clinic, payload: ClinicUpdate) -> Clinic:
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(clinic, key, value)
    db.add(clinic)
    db.commit()
    db.refresh(clinic)
    return clinic


def delete_clinic(db: Session, clinic: Clinic) -> None:
    db.delete(clinic)
    db.commit()

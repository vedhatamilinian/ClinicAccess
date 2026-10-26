from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.database import Base


class Clinic(Base):
    __tablename__ = "clinics"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    organization_name: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    address: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    state: Mapped[str] = mapped_column(String(2), nullable=False, index=True)
    postal_code: Mapped[str] = mapped_column(String(20), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    phone: Mapped[str] = mapped_column(String(40), nullable=False, default="")
    website: Mapped[str | None] = mapped_column(String(255), nullable=True)
    facility_type: Mapped[str] = mapped_column(String(64), nullable=False, default="unknown", index=True)
    medical_services: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    accepted_insurance: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    languages: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    accessibility_features: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    transit_options: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    operating_hours: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    appointment_information: Mapped[str] = mapped_column(Text, nullable=False, default="")
    data_source: Mapped[str] = mapped_column(String(120), nullable=False, default="synthetic_demo")
    record_status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    data_completeness_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    field_verification: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    google_reviews: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    last_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    __table_args__ = (Index("ix_clinics_name_lower", "name"),)


class CommunityResource(Base):
    __tablename__ = "community_resources"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    organization_name: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    address: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    city: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    state: Mapped[str] = mapped_column(String(2), nullable=False, default="GA")
    zip_code: Mapped[str] = mapped_column(String(20), nullable=False, default="")
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    phone: Mapped[str] = mapped_column(String(40), nullable=False, default="")
    website: Mapped[str | None] = mapped_column(String(512), nullable=True)
    hours: Mapped[str] = mapped_column(Text, nullable=False, default="")
    services_offered: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    eligibility_requirements: Mapped[str] = mapped_column(Text, nullable=False, default="")
    cost_information: Mapped[str] = mapped_column(Text, nullable=False, default="")
    languages_supported: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    accessibility_information: Mapped[str] = mapped_column(Text, nullable=False, default="")
    appointment_required: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    service_area: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    source_name: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    source_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    verification_status: Mapped[str] = mapped_column(String(40), nullable=False, default="unknown")
    record_status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    last_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class ClinicFieldProvenance(Base):
    __tablename__ = "clinic_field_provenance"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    clinic_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    field_name: Mapped[str] = mapped_column(String(80), nullable=False)
    verification: Mapped[str] = mapped_column(String(40), nullable=False)
    source_code: Mapped[str] = mapped_column(String(40), nullable=False)
    source_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

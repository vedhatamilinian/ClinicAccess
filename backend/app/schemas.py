from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class HealthResponse(BaseModel):
    status: str = Field(examples=["ok"])
    database: str = Field(examples=["connected"])


class ClinicBase(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    organization_name: str = Field(default="", max_length=200)
    description: str = Field(default="", max_length=4000)
    address: str = Field(min_length=5, max_length=255)
    city: str = Field(min_length=2, max_length=120)
    state: str = Field(min_length=2, max_length=2)
    postal_code: str = Field(min_length=5, max_length=20)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    phone: str = Field(default="", max_length=40)
    website: str | None = Field(default=None, max_length=255)
    medical_services: list[str] = Field(default_factory=list)
    accepted_insurance: list[str] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=list)
    accessibility_features: list[str] = Field(default_factory=list)
    transit_options: list[str] = Field(default_factory=list)
    operating_hours: dict[str, Any] = Field(default_factory=dict)
    appointment_information: str = Field(default="", max_length=2000)
    data_source: str = Field(default="synthetic_demo", max_length=120)
    facility_type: str = Field(default="unknown", max_length=64)
    record_status: str = Field(default="active", max_length=32)
    data_completeness_score: int = Field(default=0, ge=0, le=100)
    field_verification: dict[str, Any] = Field(default_factory=dict)
    google_reviews: dict[str, Any] = Field(
        default_factory=dict,
        description="Cached Google Places rating and review snippets (populated by enrich_google_reviews.py).",
    )

    @field_validator("state")
    @classmethod
    def uppercase_state(cls, value: str) -> str:
        return value.upper()


class ClinicCreate(ClinicBase):
    id: str = Field(min_length=2, max_length=64, pattern=r"^[a-z0-9-]+$")


class ClinicUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    address: str | None = Field(default=None, min_length=5, max_length=255)
    city: str | None = Field(default=None, min_length=2, max_length=120)
    state: str | None = Field(default=None, min_length=2, max_length=2)
    postal_code: str | None = Field(default=None, min_length=5, max_length=20)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    phone: str | None = Field(default=None, max_length=40)
    website: str | None = Field(default=None, max_length=255)
    medical_services: list[str] | None = None
    accepted_insurance: list[str] | None = None
    languages: list[str] | None = None
    accessibility_features: list[str] | None = None
    transit_options: list[str] | None = None
    operating_hours: dict[str, Any] | None = None
    appointment_information: str | None = Field(default=None, max_length=2000)
    data_source: str | None = Field(default=None, max_length=120)
    google_reviews: dict[str, Any] | None = None


class ClinicResponse(ClinicBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    last_verified_at: datetime | None
    created_at: datetime
    updated_at: datetime
    is_synthetic_demo: bool = Field(
        description="True when the record is fictional demonstration data, not verified real-world clinic information."
    )


class PaginatedClinicsResponse(BaseModel):
    items: list[ClinicResponse]
    total: int
    page: int
    page_size: int


class UserPreferencesInput(BaseModel):
    insurance: str
    language: str
    transportation: str = "Car"
    needs_wheelchair_access: bool = False
    origin_latitude: float | None = None
    origin_longitude: float | None = None
    origin_label: str | None = Field(
        default=None,
        description="Human-readable description of the origin used for distance (e.g. device location).",
    )
    required_insurance: bool = False
    required_language: bool = False
    required_service: str | None = None
    needs_accessible_entrance: bool = False
    needs_accessible_restroom: bool = False
    needs_hearing_accommodation: bool = False
    cost_is_barrier: bool = False
    prioritize_coordinated_care: bool = True


class RecommendationRequest(BaseModel):
    preferences: UserPreferencesInput
    q: str | None = None
    service: str | None = None
    insurance: str | None = None
    language: str | None = None
    accessible: bool | None = None
    transit: bool | None = None
    open_now: bool | None = None
    city: str | None = None
    include_demo: bool = False
    insurance_filter: bool = False
    language_filter: bool = False
    sort: str = "best-match"
    exclude_mandatory_blocked: bool = False
    exclude_excluded: bool = True
    clinic_ids: list[str] | None = None


class RecommendationItem(BaseModel):
    clinic: ClinicResponse
    match_score: float | None
    data_completeness: int
    confidence_label: str
    distance_miles: float | None = None
    distance_is_estimate: bool = True
    eligibility_status: str
    mandatory_blocked: bool
    reasons: list[str]
    barriers: list[str]
    unknown_fields: list[str]
    components: list[dict[str, Any]]
    evaluated_criteria_count: int = 0
    unknown_criteria_count: int = 0
    summary: str = ""


class RecommendationResponse(BaseModel):
    items: list[RecommendationItem]
    total: int


class CommunityResourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    category: str
    description: str
    organization_name: str
    address: str
    city: str
    state: str
    zip_code: str
    latitude: float | None = None
    longitude: float | None = None
    phone: str
    website: str | None = None
    hours: str
    services_offered: list[str] = Field(default_factory=list)
    eligibility_requirements: str
    cost_information: str
    languages_supported: list[str] = Field(default_factory=list)
    accessibility_information: str
    appointment_required: bool | None = None
    service_area: str
    source_name: str
    source_url: str | None = None
    verification_status: str
    record_status: str
    last_verified_at: datetime | None = None
    distance_miles: float | None = Field(
        default=None,
        description="Straight-line distance when origin and coordinates are provided.",
    )


class PaginatedCommunityResourcesResponse(BaseModel):
    items: list[CommunityResourceResponse]
    total: int
    page: int
    page_size: int

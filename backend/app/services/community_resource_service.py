"""Query and filter community resources."""

from __future__ import annotations

import math
from dataclasses import dataclass

from sqlalchemy import String, cast, or_, select
from sqlalchemy.orm import Session

from app.models import CommunityResource


def haversine_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    earth_radius_miles = 3958.8
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    )
    return earth_radius_miles * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


@dataclass
class ResourceQuery:
    q: str | None = None
    category: str | None = None
    zip_code: str | None = None
    language: str | None = None
    origin_latitude: float | None = None
    origin_longitude: float | None = None
    max_distance_miles: float | None = None
    sort: str = "name"


def _apply_filters(statement, filters: ResourceQuery):
    statement = statement.where(CommunityResource.record_status == "active")
    if filters.category:
        statement = statement.where(CommunityResource.category == filters.category)
    if filters.q:
        needle = f"%{filters.q.strip()}%"
        statement = statement.where(
            or_(
                CommunityResource.name.ilike(needle),
                CommunityResource.organization_name.ilike(needle),
                CommunityResource.description.ilike(needle),
                CommunityResource.service_area.ilike(needle),
                CommunityResource.address.ilike(needle),
            )
        )
    if filters.zip_code:
        zip_needle = f"%{filters.zip_code.strip()}%"
        statement = statement.where(
            or_(
                CommunityResource.zip_code.ilike(zip_needle),
                CommunityResource.address.ilike(zip_needle),
                CommunityResource.service_area.ilike(zip_needle),
            )
        )
    if filters.language:
        lang_needle = f'%"{filters.language.strip()}"%'
        statement = statement.where(cast(CommunityResource.languages_supported, String).ilike(lang_needle))
    return statement


def list_resources(
    db: Session,
    filters: ResourceQuery,
    page: int,
    page_size: int,
) -> tuple[list[tuple[CommunityResource, float | None]], int]:
    statement = select(CommunityResource)
    statement = _apply_filters(statement, filters)
    resources = list(db.scalars(statement).all())

    scored: list[tuple[CommunityResource, float | None]] = []
    for resource in resources:
        distance = None
        if (
            filters.origin_latitude is not None
            and filters.origin_longitude is not None
            and resource.latitude is not None
            and resource.longitude is not None
        ):
            distance = round(
                haversine_miles(
                    filters.origin_latitude,
                    filters.origin_longitude,
                    resource.latitude,
                    resource.longitude,
                ),
                1,
            )
        if filters.max_distance_miles is not None and distance is not None:
            if distance > filters.max_distance_miles:
                continue
        scored.append((resource, distance))

    if filters.sort == "distance" and filters.origin_latitude is not None:
        scored.sort(key=lambda item: item[1] if item[1] is not None else float("inf"))
    else:
        scored.sort(key=lambda item: item[0].name.lower())

    total = len(scored)
    start = (page - 1) * page_size
    page_items = scored[start : start + page_size]
    return page_items, total


def get_resource(db: Session, resource_id: str) -> CommunityResource | None:
    return db.get(CommunityResource, resource_id)


def resource_to_response(
    resource: CommunityResource,
    distance_miles: float | None = None,
) -> dict:
    return {
        "id": resource.id,
        "name": resource.name,
        "category": resource.category,
        "description": resource.description,
        "organization_name": resource.organization_name,
        "address": resource.address,
        "city": resource.city,
        "state": resource.state,
        "zip_code": resource.zip_code,
        "latitude": resource.latitude,
        "longitude": resource.longitude,
        "phone": resource.phone,
        "website": resource.website,
        "hours": resource.hours,
        "services_offered": resource.services_offered or [],
        "eligibility_requirements": resource.eligibility_requirements,
        "cost_information": resource.cost_information,
        "languages_supported": resource.languages_supported or [],
        "accessibility_information": resource.accessibility_information,
        "appointment_required": resource.appointment_required,
        "service_area": resource.service_area,
        "source_name": resource.source_name,
        "source_url": resource.source_url,
        "verification_status": resource.verification_status,
        "record_status": resource.record_status,
        "last_verified_at": resource.last_verified_at,
        "distance_miles": distance_miles,
    }

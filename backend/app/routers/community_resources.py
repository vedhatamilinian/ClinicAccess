from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import CommunityResourceResponse, PaginatedCommunityResourcesResponse
from app.services.community_resource_service import ResourceQuery, get_resource, list_resources, resource_to_response

router = APIRouter(prefix="/api/v1/community-resources", tags=["community-resources"])

MAX_PAGE_SIZE = 100


@router.get(
    "",
    response_model=PaginatedCommunityResourcesResponse,
    summary="List and search community resources",
)
def get_community_resources(
    q: str | None = Query(default=None, description="Search name, organization, description, or area"),
    category: str | None = Query(default=None, description="Resource category code"),
    zip_code: str | None = Query(default=None, description="ZIP or location text"),
    language: str | None = Query(default=None, description="Language supported when listed"),
    origin_latitude: float | None = Query(default=None, ge=-90, le=90),
    origin_longitude: float | None = Query(default=None, ge=-180, le=180),
    max_distance_miles: float | None = Query(default=None, gt=0, le=200),
    sort: str = Query(default="name", pattern="^(name|distance)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=MAX_PAGE_SIZE),
    db: Session = Depends(get_db),
) -> PaginatedCommunityResourcesResponse:
    filters = ResourceQuery(
        q=q,
        category=category,
        zip_code=zip_code,
        language=language,
        origin_latitude=origin_latitude,
        origin_longitude=origin_longitude,
        max_distance_miles=max_distance_miles,
        sort=sort,
    )
    items, total = list_resources(db, filters, page, page_size)
    return PaginatedCommunityResourcesResponse(
        items=[CommunityResourceResponse(**resource_to_response(resource, distance)) for resource, distance in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{resource_id}", response_model=CommunityResourceResponse, summary="Get community resource details")
def get_community_resource_by_id(
    resource_id: str,
    origin_latitude: float | None = Query(default=None, ge=-90, le=90),
    origin_longitude: float | None = Query(default=None, ge=-180, le=180),
    db: Session = Depends(get_db),
) -> CommunityResourceResponse:
    resource = get_resource(db, resource_id)
    if not resource or resource.record_status != "active":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")
    distance = None
    if (
        origin_latitude is not None
        and origin_longitude is not None
        and resource.latitude is not None
        and resource.longitude is not None
    ):
        from app.services.community_resource_service import haversine_miles

        distance = round(
            haversine_miles(origin_latitude, origin_longitude, resource.latitude, resource.longitude),
            1,
        )
    return CommunityResourceResponse(**resource_to_response(resource, distance))

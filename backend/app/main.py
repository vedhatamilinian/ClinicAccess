from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.routers import clinics, community_resources, health, recommendations


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


settings = get_settings()
origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description=(
        "ClinicAccess development API for fictional demonstration clinic records. "
        "Do not treat sample data as verified insurance acceptance, hours, or availability."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(clinics.router)
app.include_router(recommendations.router)
app.include_router(community_resources.router)

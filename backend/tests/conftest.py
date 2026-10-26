import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["ADMIN_API_KEY"] = "test-admin-key"

from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from scripts.seed_database import DEMO_CLINICS  # noqa: E402
from app.models import Clinic, CommunityResource  # noqa: E402
import json  # noqa: E402
from pathlib import Path  # noqa: E402
from app.importers.hrsa import iter_fulton_clinic_payloads  # noqa: E402

COMMUNITY_JSON = Path(__file__).resolve().parents[1] / "data" / "fulton_community_resources.json"

HRSA_FIXTURE = Path(__file__).resolve().parent / "fixtures" / "hrsa_sample.csv"

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    for payload in DEMO_CLINICS:
        db.add(Clinic(**payload))
    hrsa_payloads, _ = iter_fulton_clinic_payloads(HRSA_FIXTURE)
    for payload in hrsa_payloads:
        db.add(Clinic(**payload))
    if COMMUNITY_JSON.is_file():
        from scripts.import_community_resources import payload_from_record

        document = json.loads(COMMUNITY_JSON.read_text(encoding="utf-8"))
        verified_on = document.get("source_verified_on", "2026-01-01")
        for record in document.get("resources", []):
            db.add(CommunityResource(**payload_from_record(record, verified_on)))
    db.commit()
    db.close()
    yield


@pytest.fixture
def client():
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_headers():
    return {"X-Admin-API-Key": "test-admin-key"}

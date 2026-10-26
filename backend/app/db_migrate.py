"""Lightweight SQLite column adds for local dev (no Alembic)."""

from sqlalchemy import inspect, text

from app.database import engine


def ensure_clinic_columns() -> None:
    inspector = inspect(engine)
    if "clinics" not in inspector.get_table_names():
        return
    existing = {column["name"] for column in inspector.get_columns("clinics")}
    additions = {
        "organization_name": "VARCHAR(200) NOT NULL DEFAULT ''",
        "facility_type": "VARCHAR(64) NOT NULL DEFAULT 'unknown'",
        "record_status": "VARCHAR(32) NOT NULL DEFAULT 'active'",
        "data_completeness_score": "INTEGER NOT NULL DEFAULT 0",
        "field_verification": "TEXT NOT NULL DEFAULT '{}'",
        "google_reviews": "TEXT NOT NULL DEFAULT '{}'",
    }
    with engine.begin() as connection:
        for name, ddl in additions.items():
            if name not in existing:
                connection.execute(text(f"ALTER TABLE clinics ADD COLUMN {name} {ddl}"))


def run_migrations() -> None:
    ensure_clinic_columns()

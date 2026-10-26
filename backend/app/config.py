from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "sqlite:///./clinicaccess.db"
    cors_origins: str = "http://localhost:8081,http://127.0.0.1:8081"
    admin_api_key: str = "dev-admin-change-me"
    google_maps_api_key: str = ""
    app_name: str = "ClinicAccess API"


@lru_cache
def get_settings() -> Settings:
    return Settings()

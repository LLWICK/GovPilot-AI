from functools import lru_cache
from pathlib import Path

from pydantic import AnyHttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "GovPilot API"
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"
    frontend_origin: AnyHttpUrl = "http://localhost:3000"
    auth_secret: str = "change-this-development-auth-secret"
    access_token_ttl_seconds: int = 60 * 60 * 24

    database_url: str = "postgresql+asyncpg://govpilot:govpilot_local@localhost:5432/govpilot"
    checkpoint_database_path: Path = Path("data/langgraph-checkpoints.sqlite3")
    redis_url: str = "redis://localhost:6379/0"

    s3_endpoint_url: AnyHttpUrl = "http://localhost:9000"
    s3_access_key: str = "govpilot"
    s3_secret_key: str = "govpilot_local_secret"
    s3_bucket: str = "govpilot-documents"
    s3_region: str = "us-east-1"

    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    # SMTP & Email Settings
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    emails_from_email: str = "noreply@govpilot.lk"
    emails_from_name: str = "GovPilot AI"

    # Google OAuth
    google_client_id: str = "718295855827-cu75ds1qlnfb4gsmbr58qbnp6c8kh5t1.apps.googleusercontent.com"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()

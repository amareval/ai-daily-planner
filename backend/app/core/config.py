from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Global application configuration loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=(".env",), env_file_encoding="utf-8", extra="ignore")

    project_name: str = "AI Daily Planner API"
    environment: str = Field(default="development", pattern="^(development|staging|production)$")
    database_url: str = Field(default="sqlite:///./planner.db")
    resend_api_key: str | None = None
    daily_brief_default_send_hour: int = Field(default=7, ge=0, le=23)

    @property
    def base_path(self) -> Path:
        return Path(__file__).resolve().parent.parent


@lru_cache
def load_settings() -> Settings:
    return Settings()


settings = load_settings()

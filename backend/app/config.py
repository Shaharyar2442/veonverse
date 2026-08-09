from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


# Repo root is two levels up from this file (backend/app/config.py -> repo root).
REPO_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    # Look for .env in the repo root first, then backend/, then CWD, so the app
    # behaves the same no matter which directory it is launched from.
    model_config = SettingsConfigDict(
        env_file=(REPO_ROOT / ".env", REPO_ROOT / "backend" / ".env", ".env"),
        extra="ignore",
    )

    app_name: str = "VEONVERSE AI Leadership Mentor"
    groq_api_key: str = Field(default="", alias="GROQ_API_KEY")
    groq_model_id: str = Field(default="llama-3.3-70b-versatile", alias="GROQ_MODEL_ID")
    local_embedding_model: str = Field(
        default="sentence-transformers/all-MiniLM-L6-v2", alias="LOCAL_EMBEDDING_MODEL"
    )
    embedding_dimension: int = Field(default=384, alias="EMBEDDING_DIMENSION")

    database_url: str = Field(
        default="postgresql+psycopg2://veonverse:veonverse@postgres:5432/veonverse",
        alias="DATABASE_URL",
    )
    default_principle_id: int = Field(default=1, alias="DEFAULT_PRINCIPLE_ID")
    lesson_xp_reward: int = Field(default=100, alias="LESSON_XP_REWARD")


settings = Settings()

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "VEONVERSE AI Leadership Mentor"
    aws_region: str = Field(default="", alias="AWS_REGION")
    bedrock_model_id: str = Field(default="", alias="BEDROCK_MODEL_ID")
    bedrock_embedding_model_id: str = Field(default="", alias="BEDROCK_EMBEDDING_MODEL_ID")

    opensearch_endpoint: str = Field(default="", alias="OPENSEARCH_ENDPOINT")
    opensearch_index: str = Field(default="leadership_chunks", alias="OPENSEARCH_INDEX")
    opensearch_use_aws_sigv4: bool = Field(default=True, alias="OPENSEARCH_USE_AWS_SIGV4")
    opensearch_username: str | None = Field(default=None, alias="OPENSEARCH_USERNAME")
    opensearch_password: str | None = Field(default=None, alias="OPENSEARCH_PASSWORD")
    opensearch_verify_certs: bool = Field(default=True, alias="OPENSEARCH_VERIFY_CERTS")

    database_url: str = Field(default="sqlite:///./veonverse.db", alias="DATABASE_URL")
    default_principle_id: int = Field(default=1, alias="DEFAULT_PRINCIPLE_ID")
    lesson_xp_reward: int = Field(default=100, alias="LESSON_XP_REWARD")


settings = Settings()

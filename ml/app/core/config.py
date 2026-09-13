from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central settings for the Intelligence Service.

    This service does NOT own users, auth, or the main application
    database - see CLAUDE_CODE_PROJECT_CONTEXT.md §41. It only needs its
    own runtime configuration.
    """

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Railway Intelligence Service"
    environment: str = "development"

    # Allowed origins for the Node backend calling this service.
    allowed_origins: list[str] = ["http://localhost:5000"]


settings = Settings()

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
        )

    CLERK_WEBHOOK_SIGNING_SECRET: str
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str

settings = Settings()
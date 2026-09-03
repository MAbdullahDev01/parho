from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )

    TESTING: bool = False
    CLERK_WEBHOOK_SIGNING_SECRET_TESTING: str | None = None

    CLERK_WEBHOOK_SIGNING_SECRET: str
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    INTERNAL_API_SECRET: str | None = None

    # Safepay
    SAFE_PAY_ENV: str = "sandbox"
    SAFE_PAY_SECRET_KEY: str | None = None
    SAFE_PAY_PUBLIC_KEY: str | None = None
    SAFE_PAY_V1_SECRET: str | None = None
    SAFE_PAY_WEBHOOK_SECRET: str | None = None

    OPENAI_API_KEY: str | None = None
    OPENAI_AUTO_VERIFICATION_MODEL: str = "gpt-5.6-luna"
    AUTO_VERIFICATION_ENABLED: bool = False
    AUTO_VERIFICATION_FLAG_THRESHOLD: float = 65.0


settings = Settings()

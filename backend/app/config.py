from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://user:password@localhost:5432/dataveil"
    supabase_jwt_secret: str = "your-supabase-jwt-secret"
    stripe_secret_key: str = "sk_test_..."
    stripe_webhook_secret: str = "whsec_..."
    frontend_url: str = "http://localhost:5173"

    class Config:
        env_file = ".env"


settings = Settings()

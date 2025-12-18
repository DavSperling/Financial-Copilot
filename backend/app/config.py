from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_KEY: str  # Anon key
    SUPABASE_SERVICE_ROLE_KEY: str
    FRONTEND_URL: str = "http://localhost:5173"  # Default for local dev

    class Config:
        env_file = "../.env.local"
        # Since we are running from backend folder, we look for .env.local in the project root
        env_file_encoding = 'utf-8'
        extra = 'ignore'  # Allow extra env vars not defined in Settings

@lru_cache()
def get_settings():
    return Settings()

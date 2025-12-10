from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_KEY: str  # Anon key
    SUPABASE_SERVICE_ROLE_KEY: str
    FRONTEND_URL: str = "http://localhost:5173"  # Default for local dev

    class Config:
        env_file = ".env"
        # Since we are running from backend folder or root, we might need to look for env file.
        # Ideally the user runs this with env vars set, or we point to the parent .env
        env_file_encoding = 'utf-8'

@lru_cache()
def get_settings():
    return Settings()

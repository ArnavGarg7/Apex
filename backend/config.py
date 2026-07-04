"""
backend/config.py
Environment configuration loader.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Firebase — choose one of: service account path OR inline JSON
    FIREBASE_SERVICE_ACCOUNT_PATH: str = ''
    FIREBASE_CREDENTIALS_JSON: str = ''   # JSON string of the service account

    # OpenWeatherMap
    OPENWEATHER_API_KEY: str = ''

    # FastF1 cache
    FF1_CACHE_PATH: str = './data/ff1_cache'

    # App
    APP_ENV: str = 'development'
    CORS_ORIGINS: str = 'http://localhost:5173'

    # Gemini
    GEMINI_API_KEY: str = ''

    # ── Live Collector Relay ─────────────────────────────────────────────
    # When True, the backend does NOT connect to the F1 SignalR stream itself
    # (Cloud Run's datacenter IP is 403-blocked). Instead it receives live
    # frames pushed to POST /api/live/ingest by a local relay running on an
    # unblocked residential IP. Set to 'true' on Cloud Run.
    DISABLE_LIVE_SIGNALR: bool = False
    # Shared secret the local relay must present (header: X-Ingest-Secret)
    # to push frames into POST /api/live/ingest. Ingest is disabled if empty.
    LIVE_INGEST_SECRET: str = ''

    class Config:
        env_file = '.env'
        env_file_encoding = 'utf-8'
        extra = 'ignore'


@lru_cache()
def get_settings() -> Settings:
    return Settings()

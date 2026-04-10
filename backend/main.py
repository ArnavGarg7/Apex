"""
backend/main.py
FastAPI application entry point.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(name)s: %(message)s')
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Warm-load ML models on startup."""
    logger.info("APEX backend starting...")
    try:
        from backend.services.model_service import preload_models
        await preload_models()
        logger.info("ML models preloaded.")
    except Exception as e:
        logger.warning(f"ML preload skipped: {e}")
    yield
    logger.info("APEX backend shutting down.")


app = FastAPI(
    title='APEX F1 Intelligence API',
    version='1.0.0',
    description='Live timing, historical data, ML strategy predictions',
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173', 'http://localhost:3000', 'https://apex.yourdomain.com'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Register routes
from backend.routes import live, historical, strategy, standings, calendar, circuit, weather, simulate, news

app.include_router(live.router,       prefix='/api/live',       tags=['Live Timing'])
app.include_router(historical.router, prefix='/api/historical', tags=['Historical'])
app.include_router(strategy.router,   prefix='/api/strategy',   tags=['Strategy'])
app.include_router(standings.router,  prefix='/api/standings',  tags=['Standings'])
app.include_router(calendar.router,   prefix='/api/calendar',   tags=['Calendar'])
app.include_router(circuit.router,    prefix='/api/circuit',    tags=['Circuit'])
app.include_router(weather.router,    prefix='/api/weather',    tags=['Weather'])
app.include_router(simulate.router,   prefix='/api/simulate',   tags=['Simulate'])
app.include_router(news.router,       prefix='/api/news',       tags=['News'])


@app.get('/api/health', tags=['Health'])
async def health():
    return {'status': 'ok', 'service': 'APEX F1 Intelligence API'}

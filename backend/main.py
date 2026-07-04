"""
backend/main.py
FastAPI application entry point.
"""
from contextlib import asynccontextmanager
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(name)s: %(message)s')
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start background services and warm-load ML models on startup."""
    logger.info("APEX backend starting...")

    # ── ML models ────────────────────────────────────────────────────────
    try:
        from backend.services.model_service import preload_models
        await preload_models()
        logger.info("ML models preloaded.")
    except Exception as e:
        logger.warning(f"ML preload skipped: {e}")

    # ── F1 SignalR live timing service ───────────────────────────────────
    # In production, Cloud Run's datacenter IP is 403-blocked by F1, so we do
    # NOT connect directly. Instead a local relay (f1_local_relay.py) running
    # on a residential IP pushes frames to POST /api/live/ingest. Toggle with
    # DISABLE_LIVE_SIGNALR. Either way the cache still needs the event loop
    # reference so ingested frames can be broadcast to SSE clients.
    try:
        from backend.config import get_settings
        from backend.services.signalr_service import cache, service
        cache.set_event_loop(asyncio.get_running_loop())
        if get_settings().DISABLE_LIVE_SIGNALR:
            logger.info("Direct F1 SignalR disabled — running in relay-ingest mode.")
        else:
            service.start()
            logger.info("F1 SignalR timing service started.")
    except Exception as e:
        logger.warning(f"SignalR service setup skipped: {e}")

    yield

    # ── Graceful shutdown ─────────────────────────────────────────────────
    try:
        from backend.services.signalr_service import service as _svc
        _svc.stop()
    except Exception:
        pass
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
    allow_origins=[
        'http://localhost:5173', 
        'http://localhost:3000', 
        'https://apex-92c8d.web.app',
        'https://apex-92c8d.firebaseapp.com'
    ],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Register routes
from backend.routes import live, historical, strategy, standings, calendar, circuit, weather, simulate, radio, teammates, storyteller

app.include_router(live.router,       prefix='/api/live',       tags=['Live Timing'])
app.include_router(historical.router, prefix='/api/historical', tags=['Historical'])
app.include_router(strategy.router,   prefix='/api/strategy',   tags=['Strategy'])
app.include_router(standings.router,  prefix='/api/standings',  tags=['Standings'])
app.include_router(calendar.router,   prefix='/api/calendar',   tags=['Calendar'])
app.include_router(circuit.router,    prefix='/api/circuit',    tags=['Circuit'])
app.include_router(weather.router,    prefix='/api/weather',    tags=['Weather'])
app.include_router(simulate.router,   prefix='/api/simulate',   tags=['Simulate'])
app.include_router(radio.router,      prefix='/api/radio',      tags=['Radio'])
app.include_router(teammates.router,  prefix='/api/teammates',  tags=['Teammates'])
app.include_router(storyteller.router, prefix='/api/story',     tags=['Storyteller'])


@app.get('/api/health', tags=['Health'])
async def health():
    return {'status': 'ok', 'service': 'APEX F1 Intelligence API'}

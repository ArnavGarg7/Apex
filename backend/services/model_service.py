"""
backend/services/model_service.py
Wraps the ML predict module for async use within FastAPI.
Handles lazy model loading and live data assembly for prediction.
"""
import asyncio
import logging
from typing import Optional
from backend.services import openf1_service as openf1

logger = logging.getLogger(__name__)

_predictor = None


def _get_predictor():
    global _predictor
    if _predictor is None:
        try:
            from ml.predict import models_loaded
            if models_loaded():
                _predictor = True
                logger.info("ML Predictor loaded successfully")
            else:
                logger.warning("ML Predictor loaded but models are missing.")
                _predictor = None
        except Exception as e:
            logger.warning(f"ML Predictor not available: {e}")
            _predictor = None
    return _predictor


async def predict_for_driver(session_key: int, driver_number: int) -> Optional[dict]:
    """
    Fetches live data for a driver and generates pit-stop prediction.
    Returns prediction dict or None if models or data unavailable.
    """
    predictor = _get_predictor()
    if predictor is None:
        return None

    try:
        # Fetch recent lap data and driver info
        laps    = await openf1.get_lap_data(session_key, driver_number, last_n=3)
        pits    = await openf1.get_pit_data(session_key)
        drivers = await openf1.get_drivers(session_key)

        if not laps:
            return None

        latest_lap = laps[-1]
        pit_counts = sum(1 for p in pits if p.get('driver_number') == driver_number)
        driver_info = next((d for d in drivers if d.get('driver_number') == driver_number), {})

        # Build feature row
        feature_row = {
            'compound':       latest_lap.get('compound', 'UNKNOWN'),
            'tyre_life':      latest_lap.get('tyre_life_laps', 0) or 0,
            'lap_number':     latest_lap.get('lap_number', 0) or 0,
            'pit_stops':      pit_counts,
            'lap_time':       latest_lap.get('lap_duration', 90.0) or 90.0,
            'is_sc':          False,  # Would need race-control data
            'driver_number':  driver_number,
        }

        # Run prediction in thread to avoid blocking event loop
        loop = asyncio.get_event_loop()
        from ml.predict import predict_pit
        result = await loop.run_in_executor(None, predict_pit, feature_row)

        return result

    except Exception as e:
        logger.error(f"Prediction failed for driver {driver_number}: {e}")
        return None


async def preload_models():
    """Called on app startup to warm-load models."""
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _get_predictor)

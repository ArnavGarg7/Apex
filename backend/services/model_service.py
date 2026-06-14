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

    Data priority: OpenF1 REST → SignalR cache (live).
    """
    predictor = _get_predictor()
    if predictor is None:
        return None

    try:
        # Fetch all laps for the driver to reconstruct stint history
        laps    = await openf1.get_lap_data(session_key, driver_number)
        pits    = await openf1.get_pit_data(session_key)
        drivers = await openf1.get_drivers(session_key)

        if not laps:
            raise ValueError("No lap data from OpenF1")

        latest_lap = laps[-1]
        pit_counts = sum(1 for p in pits if p.get('driver_number') == driver_number)
        
        # Build stint history
        stints = []
        current_stint = None
        for lap in laps:
            comp = lap.get('compound', 'UNKNOWN')
            lap_num = lap.get('lap_number', 0)
            if not current_stint or current_stint['compound'] != comp:
                if current_stint:
                    current_stint['endLap'] = lap_num - 1
                    stints.append(current_stint)
                current_stint = {'compound': comp, 'startLap': lap_num}
        if current_stint:
            current_stint['endLap'] = latest_lap.get('lap_number', 0)
            stints.append(current_stint)

        # Map compound to integer encoding
        compound_map = {'SOFT': 0, 'MEDIUM': 1, 'HARD': 2, 'INTERMEDIATE': 3, 'WET': 4}
        compound_str = str(latest_lap.get('compound', 'UNKNOWN')).upper()
        compound_enc = compound_map.get(compound_str, 1) # Default to medium if unknown

        # Calculate pace delta if possible
        lap_time_delta = 0.0
        if len(laps) >= 2:
            prev_time = laps[-2].get('lap_duration')
            curr_time = latest_lap.get('lap_duration')
            if prev_time and curr_time:
                lap_time_delta = float(curr_time) - float(prev_time)

        # Build feature row exactly matching predict.py expected columns
        feature_row = {
            'lap_number':       latest_lap.get('lap_number', 0) or 0,
            'tyre_age':         latest_lap.get('tyre_life_laps', 0) or 0,
            'compound_enc':     compound_enc,
            'lap_time_delta':   lap_time_delta,
            'gap_ahead':        0.0,  # F1 live telemetry does not stream inline interval deltas cleanly
            'gap_behind':       0.0,
            'sc_lap':           1 if latest_lap.get('is_pit_out_lap') else 0, # proxy is_sc or outlap
            'circuit_id':       'unknown',
            'total_race_laps':  60,
            'pit_loss_avg':     22.5,
        }

        # Run prediction in thread
        loop = asyncio.get_event_loop()
        from ml.predict import predict_pit
        result = await loop.run_in_executor(None, predict_pit, feature_row)
        
        # Merge live stint data into result
        result['stints'] = stints
        result['total_laps'] = 60 # Default/placeholder, would need session context to know total

        return result

    except Exception as e:
        logger.warning(f"OpenF1 prediction path failed for driver {driver_number}: {e}")

        # ── SignalR Fallback ─────────────────────────────────────────────
        try:
            from backend.services.signalr_service import cache
            timing_app = cache.get('TimingAppData') or {}
            timing_data = cache.get('TimingData') or {}
            driver_list = cache.get('DriverList') or {}
            lap_count = cache.get('LapCount') or {}

            dn_str = str(driver_number)
            app_line = (timing_app.get('Lines', {}) or {}).get(dn_str, {}) or {}
            timing_line = (timing_data.get('Lines', {}) or {}).get(dn_str, {}) or {}

            if not app_line and not timing_line:
                return None

            # Extract stint info from TimingAppData
            stints_raw = app_line.get('Stints', {})
            stints = []
            compound = 'UNKNOWN'
            tyre_age = 0
            pit_stops = 0
            if stints_raw:
                stint_list = list(stints_raw.values()) if isinstance(stints_raw, dict) else stints_raw
                for i, stint in enumerate(stint_list):
                    if isinstance(stint, dict):
                        stints.append({
                            'compound': stint.get('Compound', 'UNKNOWN'),
                            'startLap': stint.get('StartLaps', i * 15 + 1),
                            'endLap': stint.get('TotalLaps', 0) + stint.get('StartLaps', i * 15 + 1),
                        })
                if stint_list:
                    latest = stint_list[-1]
                    if isinstance(latest, dict):
                        compound = latest.get('Compound', 'UNKNOWN')
                        tyre_age = latest.get('TotalLaps', 0)
                        pit_stops = max(0, len(stint_list) - 1)

            current_lap = lap_count.get('CurrentLap', 0) if isinstance(lap_count, dict) else 0
            total_laps = lap_count.get('TotalLaps', 60) if isinstance(lap_count, dict) else 60

            compound_map = {'SOFT': 0, 'MEDIUM': 1, 'HARD': 2, 'INTERMEDIATE': 3, 'WET': 4}
            compound_enc = compound_map.get(str(compound).upper(), 1)

            feature_row = {
                'lap_number':       current_lap or 0,
                'tyre_age':         tyre_age or 0,
                'compound_enc':     compound_enc,
                'lap_time_delta':   0.0,
                'gap_ahead':        0.0,
                'gap_behind':       0.0,
                'sc_lap':           0,
                'circuit_id':       'unknown',
                'total_race_laps':  total_laps,
                'pit_loss_avg':     22.5,
            }

            loop = asyncio.get_event_loop()
            from ml.predict import predict_pit
            result = await loop.run_in_executor(None, predict_pit, feature_row)
            result['stints'] = stints
            result['total_laps'] = total_laps
            return result

        except Exception as e2:
            logger.error(f"SignalR prediction fallback also failed for driver {driver_number}: {e2}")
            return None


async def preload_models():
    """Called on app startup to warm-load models."""
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _get_predictor)

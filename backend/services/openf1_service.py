"""
backend/services/openf1_service.py
Async OpenF1 API client — all endpoints needed for APEX.
"""
import httpx
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

OPENF1_BASE = 'https://api.openf1.org/v1'
TIMEOUT      = 15.0


async def _get(endpoint: str, params: dict = None) -> list:
    """Generic GET to OpenF1 API."""
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        resp = await client.get(f'{OPENF1_BASE}/{endpoint}', params=params)
        resp.raise_for_status()
        return resp.json()


async def get_latest_session_key() -> Optional[int]:
    """Get the session key of the most recent session."""
    sessions = await _get('sessions', {'session_key': 'latest'})
    if sessions:
        return sessions[-1].get('session_key')
    return None


async def get_session_status(session_key: str = 'latest') -> list:
    """Get session details."""
    return await _get('sessions', {'session_key': session_key})


async def get_drivers(session_key: int) -> list:
    """All drivers in a session."""
    return await _get('drivers', {'session_key': session_key})


async def get_intervals(session_key: int) -> list:
    """Live gaps/intervals."""
    return await _get('intervals', {'session_key': session_key})


async def get_lap_data(session_key: int, driver_number: int = None, last_n: int = None) -> list:
    """Lap data — all drivers or specific driver, optionally limited."""
    params = {'session_key': session_key}
    if driver_number:
        params['driver_number'] = driver_number
    laps = await _get('laps', params)
    if last_n is not None and driver_number is not None:
        laps = laps[-last_n:] if len(laps) >= last_n else laps
    return laps


async def get_pit_data(session_key: int) -> list:
    """Pit stop records."""
    return await _get('pit', {'session_key': session_key})


async def get_car_data(session_key: int, driver_number: int) -> list:
    """Car telemetry — speed, throttle, brake, drs, gear."""
    return await _get('car_data', {'session_key': session_key, 'driver_number': driver_number})


async def get_weather(session_key: int) -> list:
    """Track-side weather from OpenF1."""
    return await _get('weather', {'session_key': session_key})


async def get_race_control(session_key: int) -> list:
    """Race control messages (SC, VSC, flags, penalties)."""
    return await _get('race_control', {'session_key': session_key})


async def get_position(session_key: int, driver_number: int = None) -> list:
    """Historical position data."""
    params = {'session_key': session_key}
    if driver_number:
        params['driver_number'] = driver_number
    return await _get('position', params)

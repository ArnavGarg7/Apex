"""
backend/routes/live.py
Live timing and session data.

Data priority:
  1. F1 SignalR cache (real-time, free, no delay)  ← during active sessions
  2. OpenF1 REST API (30-s delay, free off-session) ← fallback
  3. FastF1 calendar (session detection only)        ← last resort during blocked races
"""
import asyncio
import json
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse

from backend.services import openf1_service as openf1
from backend.dependencies import require_auth

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _get_cache():
    """Return the module-level SignalR cache (lazy import to avoid circular deps)."""
    from backend.services.signalr_service import cache
    return cache


# ─── Session ─────────────────────────────────────────────────────────────────

@router.get('/session')
async def get_current_session(user=Depends(require_auth)):
    """
    Current session status.
    Priority: SignalR cache → OpenF1 REST → FastF1 calendar fallback.
    """
    from datetime import datetime, timezone, timedelta

    cache = _get_cache()

    # ① SignalR cache: available whenever the stream is connected
    if cache.is_populated:
        from backend.services.signalr_service import build_session_response
        return build_session_response(cache)

    # ② OpenF1 REST API (works off-session only)
    try:
        sessions = await openf1.get_session_status()

        # OpenF1 returns a dict with 'detail' when blocking (live race paywall)
        if isinstance(sessions, dict) and 'detail' in sessions:
            # Stream blocked → signal live-restricted, use calendar for metadata
            return await _restricted_fallback()

        if not sessions:
            return {'status': 'Off-Season', 'is_live': False, 'data_delay_seconds': 30}

        s = sessions[-1]
        is_live = s.get('session_status', '') in ('Started',)

        # Treat sessions ended > 6 h ago as off-season
        date_str = s.get('date_end') or s.get('date_start') or ''
        if date_str:
            try:
                ended = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                if (datetime.now(timezone.utc) - ended) > timedelta(hours=6) and not is_live:
                    return {
                        'status': 'Off-Season', 'is_live': False,
                        'data_delay_seconds': 30,
                        'country_name': None, 'session_name': None, 'circuit_short_name': None,
                    }
            except Exception:
                pass

        return {**s, 'is_live': is_live, 'data_delay_seconds': 30}

    except Exception as e:
        logger.error(f'OpenF1 session error: {e}')
        if '429' in str(e):
            return {
                'status': 'API Rate Limited', 'is_live': False,
                'data_restricted': True, 'data_delay_seconds': 30,
            }
        # ③ Last resort: FastF1 calendar fallback
        return await _restricted_fallback()


async def _restricted_fallback() -> dict:
    """Use FastF1 schedule when OpenF1 is blocked during a live race."""
    from datetime import datetime, timezone
    from backend.services import fastf1_service as ff1

    try:
        loop = asyncio.get_event_loop()
        year = datetime.now(timezone.utc).year
        ev = await loop.run_in_executor(None, ff1.get_current_event_info, year)
        return {
            'status':             ev.get('session_name', 'Race'),
            'is_live':            True,
            'data_restricted':    True,
            'data_delay_seconds': 30,
            'country_name':       ev.get('country_name'),
            'session_name':       ev.get('session_name'),
            'circuit_short_name': ev.get('circuit_short_name'),
            'meeting_name':       ev.get('meeting_name'),
        }
    except Exception:
        return {
            'status': 'Off-Season', 'is_live': False,
            'data_restricted': False, 'data_delay_seconds': 30,
        }


# ─── Live Timing ──────────────────────────────────────────────────────────────

@router.get('/timing')
async def get_live_timing(session_key: Optional[str] = None, user=Depends(require_auth)):
    """
    Returns latest timing board data. If session_key is omitted or 'latest',
    we first check the SignalR cache. If not available/stale, fallback to OpenF1.
    """
    cache = _get_cache()

    # ① SignalR cache
    if cache.is_populated and cache.get('TimingData'):
        from backend.services.signalr_service import build_timing_response
        return build_timing_response(cache)

    # ② OpenF1 fallback
    try:
        if not session_key:
            session_key = await openf1.get_latest_session_key()
        if not session_key:
            raise HTTPException(status_code=404, detail='No active session')

        drivers   = await openf1.get_drivers(session_key)
        intervals = await openf1.get_intervals(session_key)
        laps_all  = await openf1.get_lap_data(session_key)
        pits      = await openf1.get_pit_data(session_key)

        pit_counts    = {}
        for p in pits:
            dn = p.get('driver_number', 0)
            pit_counts[dn] = pit_counts.get(dn, 0) + 1

        interval_map = {i.get('driver_number'): i for i in intervals}

        timing = []
        for drv in drivers:
            dn          = drv.get('driver_number', 0)
            iv          = interval_map.get(dn, {})
            driver_laps = [l for l in laps_all if l.get('driver_number') == dn]
            latest_lap  = driver_laps[-1] if driver_laps else {}

            timing.append({
                'driver_number':  dn,
                'driver_code':    drv.get('name_acronym', '???'),
                'driver_name':    drv.get('full_name', ''),
                'team_name':      drv.get('team_name', ''),
                'position':       iv.get('position', 0),
                'gap_to_leader':  iv.get('gap_to_leader'),
                'interval':       iv.get('interval'),
                'last_lap_time':  latest_lap.get('lap_duration'),
                'compound':       latest_lap.get('compound', 'UNKNOWN'),
                'tyre_age':       latest_lap.get('tyre_life_laps', 0),
                'pit_stops':      pit_counts.get(dn, 0),
                'drs_open':       False,
                'data_delay_seconds': 30,
            })

        timing.sort(key=lambda x: x.get('position') or 99)
        return timing

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# ─── Driver Laps ─────────────────────────────────────────────────────────────

@router.get('/lap-chart')
async def get_lap_chart(session_key: Optional[str] = None, user=Depends(require_auth)):
    """Lap history for all drivers (from cache) for the Lap Chart."""
    cache = _get_cache()
    if cache.is_populated:
        result = {}
        driver_list = cache.get('DriverList') or {}
        timing_app = cache.get('TimingAppData') or {}
        app_lines = timing_app.get('Lines', {})

        for num_str, drv in driver_list.items():
            if not isinstance(drv, dict): continue
            code = drv.get('Tla')
            if not code: continue
            
            with cache._lock:
                # lap history populated by signalr_service
                laps = list(cache._lap_history.get(code, []))
            
            al = app_lines.get(num_str, {})
            stints = al.get('Stints', {})
            pit_laps = []
            if isinstance(stints, dict):
                 laps_sum = 0
                 stint_list = list(stints.values())
                 for s in stint_list[:-1]:
                     if isinstance(s, dict):
                         laps_sum += int(s.get('TotalLaps', 0))
                         if laps_sum > 0:
                             pit_laps.append(laps_sum)
            
            result[code] = {
                'laps': laps,
                'teamName': drv.get('TeamName', ''),
                'pitLaps': pit_laps
            }
        return result
    return {}


@router.get('/laps/{driver_number}')
async def get_driver_laps(
    driver_number: int,
    session_key: Optional[str] = None,
    last_n: int = 5,
    user=Depends(require_auth),
):
    """Recent laps for a specific driver."""
    try:
        if not session_key:
            session_key = await openf1.get_latest_session_key()
        if not session_key:
            raise HTTPException(status_code=404, detail='No active session')
        laps = await openf1.get_lap_data(session_key, driver_number, last_n)
        return [{'data_delay_seconds': 30, **l} for l in laps]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# ─── Pit Stops ───────────────────────────────────────────────────────────────

@router.get('/pits')
async def get_pits(session_key: Optional[str] = None, user=Depends(require_auth)):
    """Pit stop data for the current session."""
    try:
        if not session_key:
            session_key = await openf1.get_latest_session_key()
        if not session_key:
            return []
        pits = await openf1.get_pit_data(session_key)
        return [{'data_delay_seconds': 30, **p} for p in pits]
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# ─── Car Telemetry ───────────────────────────────────────────────────────────

@router.get('/car/{driver_number}')
async def get_car_data(
    driver_number: int,
    session_key: Optional[str] = None,
    user=Depends(require_auth),
):
    """Car telemetry (speed, throttle, brake, gear, DRS)."""
    cache = _get_cache()

    # ① SignalR CarData (decoded from CarData.z)
    car_cache = cache.get('CarData') or {}
    if car_cache:
        entries = car_cache.get('Entries', [])
        # Filter to the requested driver and return last 50 data points
        driver_data = []
        for entry in entries:
            cars = entry.get('Cars', {})
            dn_str = str(driver_number)
            if dn_str in cars:
                ch = cars[dn_str].get('Channels', {})
                driver_data.append({
                    'speed':    ch.get('2',  0),   # Channel 2 = Speed
                    'throttle': ch.get('4',  0),   # Channel 4 = Throttle %
                    'brake':    ch.get('5',  False), # Channel 5 = Brake
                    'gear':     ch.get('3',  0),   # Channel 3 = nGear
                    'drs':      ch.get('45', 0),   # Channel 45 = DRS
                    'rpm':      ch.get('0',  0),   # Channel 0 = RPM
                })
        if driver_data:
            return driver_data[-50:]

    # ② OpenF1 fallback
    try:
        if not session_key:
            session_key = await openf1.get_latest_session_key()
        if not session_key:
            raise HTTPException(status_code=404, detail='No active session')
        data = await openf1.get_car_data(session_key, driver_number)
        return data[-50:] if data else []
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# ─── Weather ─────────────────────────────────────────────────────────────────

@router.get('/weather')
async def get_track_weather(session_key: Optional[str] = None, user=Depends(require_auth)):
    """
    Latest weather data (AirTemp, TrackTemp, Humidity, etc.)
    Cache-first.
    """
    cache = _get_cache()

    if cache.get('WeatherData'):
        from backend.services.signalr_service import build_weather_response
        return build_weather_response(cache)

    try:
        if not session_key:
            session_key = await openf1.get_latest_session_key()
        if not session_key:
            return {}
        weather = await openf1.get_weather(session_key)
        return weather[-1] if weather else {}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# ─── Race Control ─────────────────────────────────────────────────────────────

@router.get('/race-control')
async def get_race_control(session_key: Optional[str] = None, user=Depends(require_auth)):
    """Race control messages (flags, SC, VSC, penalties) — cache-first."""
    cache = _get_cache()

    if cache.get('RaceControlMessages'):
        from backend.services.signalr_service import build_race_control_response
        return build_race_control_response(cache)

    try:
        if not session_key:
            session_key = await openf1.get_latest_session_key()
        if not session_key:
            return []
        return await openf1.get_race_control(session_key)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# ─── SSE Live Stream ──────────────────────────────────────────────────────────

@router.get('/stream')
async def live_stream(request: Request, token: str = ''):
    """
    Server-Sent Events endpoint — pushes SignalR updates to the frontend
    in real time.  Connect with EventSource in the browser.

    Query param: ?token=<firebase_id_token>
    EventSource cannot send Authorization headers, so we accept the token
    as a query parameter and verify it manually.
    """
    # Manual auth — EventSource can only send query params, not headers
    if not token:
        raise HTTPException(status_code=401, detail='Missing authentication token')
    from backend.services.firebase_service import verify_token
    decoded = await verify_token(token)
    if not decoded:
        raise HTTPException(status_code=403, detail='Invalid or expired token')
    cache = _get_cache()
    queue: asyncio.Queue = asyncio.Queue(maxsize=100)
    cache.register_sse_queue(queue)

    async def event_generator():
        try:
            # ① Send the current snapshot immediately on connect
            from backend.services.signalr_service import (
                build_session_response, build_timing_response,
            )
            if cache.is_populated:
                snapshot = {
                    'session': build_session_response(cache),
                    'timing':  build_timing_response(cache),
                }
                yield f"event: snapshot\ndata: {json.dumps(snapshot)}\n\n"

            # ② Stream live updates
            while not await request.is_disconnected():
                try:
                    msg = await asyncio.wait_for(queue.get(), timeout=25.0)
                    yield f"event: update\ndata: {json.dumps(msg)}\n\n"
                except asyncio.TimeoutError:
                    # Send a heartbeat comment to keep the connection alive
                    yield ': heartbeat\n\n'

        finally:
            cache.unregister_sse_queue(queue)

    return StreamingResponse(
        event_generator(),
        media_type='text/event-stream',
        headers={
            'Cache-Control':              'no-cache',
            'X-Accel-Buffering':          'no',   # Disable nginx buffering
            'Access-Control-Allow-Origin': '*',
        },
    )

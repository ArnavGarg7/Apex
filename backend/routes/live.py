"""
backend/routes/live.py
Live timing and session data from OpenF1.
All endpoints include data_delay_seconds: 30 per spec.
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from typing import List, Optional
from backend.services import openf1_service as openf1
from backend.dependencies import require_auth

router = APIRouter()


@router.get('/session')
async def get_current_session(user=Depends(require_auth)):
    """Current/latest session status. Returns off-season state when no active session."""
    from datetime import datetime, timezone, timedelta
    try:
        sessions = await openf1.get_session_status()
        if not sessions:
            return {'status': 'Off-Season', 'is_live': False, 'data_delay_seconds': 30}
        s = sessions[-1]
        is_live = s.get('session_status', '') in ('Started',)

        # Check if the session date is more than 6 hours in the past
        # If so, treat it as off-season rather than showing stale labels
        session_date_str = s.get('date_end') or s.get('date_start') or ''
        if session_date_str:
            try:
                # OpenF1 dates are UTC ISO strings
                session_end = datetime.fromisoformat(session_date_str.replace('Z', '+00:00'))
                stale = (datetime.now(timezone.utc) - session_end) > timedelta(hours=6)
                if stale and not is_live:
                    return {
                        'status':              'Off-Season',
                        'is_live':             False,
                        'data_delay_seconds':  30,
                        'country_name':        None,
                        'session_name':        None,
                        'circuit_short_name':  None,
                    }
            except Exception:
                pass  # If date parsing fails, fall through to normal response

        return {
            **s,
            'is_live': is_live,
            'data_delay_seconds': 30,
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))



@router.get('/timing')
async def get_timing(session_key: Optional[int] = None, user=Depends(require_auth)):
    """Live timing for all drivers."""
    try:
        if not session_key:
            session_key = await openf1.get_latest_session_key()
        if not session_key:
            raise HTTPException(status_code=404, detail='No active session')

        drivers = await openf1.get_drivers(session_key)
        intervals = await openf1.get_intervals(session_key)
        laps_all = await openf1.get_lap_data(session_key)
        pits = await openf1.get_pit_data(session_key)

        pit_counts = {}
        for p in pits:
            dn = p.get('driver_number', 0)
            pit_counts[dn] = pit_counts.get(dn, 0) + 1

        interval_map = {i.get('driver_number'): i for i in intervals}

        timing = []
        for drv in drivers:
            dn = drv.get('driver_number', 0)
            iv = interval_map.get(dn, {})
            driver_laps = [l for l in laps_all if l.get('driver_number') == dn]
            latest_lap = driver_laps[-1] if driver_laps else {}

            timing.append({
                'driver_number': dn,
                'driver_code': drv.get('name_acronym', '???'),
                'driver_name': drv.get('full_name', ''),
                'team_name': drv.get('team_name', ''),
                'position': iv.get('position', 0),
                'gap_to_leader': iv.get('gap_to_leader'),
                'interval': iv.get('interval'),
                'last_lap_time': latest_lap.get('lap_duration'),
                'compound': latest_lap.get('compound', 'UNKNOWN'),
                'tyre_age': latest_lap.get('tyre_life_laps', 0),
                'pit_stops': pit_counts.get(dn, 0),
                'drs_open': False,
                'data_delay_seconds': 30,
            })

        timing.sort(key=lambda x: x.get('position') or 99)
        return timing

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get('/laps/{driver_number}')
async def get_driver_laps(driver_number: int, session_key: Optional[int] = None,
                           last_n: int = 5, user=Depends(require_auth)):
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


@router.get('/pits')
async def get_pits(session_key: Optional[int] = None, user=Depends(require_auth)):
    """Pit stop data for current session."""
    try:
        if not session_key:
            session_key = await openf1.get_latest_session_key()
        if not session_key:
            return []
        pits = await openf1.get_pit_data(session_key)
        return [{'data_delay_seconds': 30, **p} for p in pits]
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get('/car/{driver_number}')
async def get_car_data(driver_number: int, session_key: Optional[int] = None,
                        user=Depends(require_auth)):
    """Car telemetry for a driver."""
    try:
        if not session_key:
            session_key = await openf1.get_latest_session_key()
        if not session_key:
            raise HTTPException(status_code=404, detail='No active session')
        data = await openf1.get_car_data(session_key, driver_number)
        return data[-50:] if data else []  # Last 50 data points
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get('/weather')
async def get_track_weather(session_key: Optional[int] = None, user=Depends(require_auth)):
    """Track weather from OpenF1."""
    try:
        if not session_key:
            session_key = await openf1.get_latest_session_key()
        if not session_key:
            return {}
        weather = await openf1.get_weather(session_key)
        return weather[-1] if weather else {}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get('/race-control')
async def get_race_control(session_key: Optional[int] = None, user=Depends(require_auth)):
    """Race control messages."""
    try:
        if not session_key:
            session_key = await openf1.get_latest_session_key()
        if not session_key:
            return []
        return await openf1.get_race_control(session_key)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

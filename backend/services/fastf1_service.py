"""
backend/services/fastf1_service.py
FastF1 historical data service — complete, with telemetry comparison, 
all-time drivers/constructors, topology for all 24 circuits.
All functions are synchronous — call via asyncio.run_in_executor() from routes.
"""
import logging
import fastf1
import pandas as pd
from pathlib import Path

logger = logging.getLogger(__name__)

# Cache directory
cache_dir = Path(__file__).parents[2] / 'data' / 'ff1_cache'
cache_dir.mkdir(parents=True, exist_ok=True)
fastf1.Cache.enable_cache(str(cache_dir))


def _safe_val(val):
    """Convert numpy/pandas NaN to None for JSON serialization."""
    try:
        if pd.isna(val):
            return None
    except Exception:
        pass
    return val


# ─── Laps ────────────────────────────────────────────────────────────────────

def get_race_laps(year: int, round: int, driver: str = None) -> list:
    try:
        session = fastf1.get_session(year, round, 'R')
        session.load(laps=True, telemetry=False, weather=False, messages=False)
        laps = session.laps
        if driver:
            laps = laps[laps['Driver'] == driver]
        return [
            {
                'driver':       row['Driver'],
                'lap_number':   _safe_val(row['LapNumber']),
                'lap_time_s':   row['LapTime'].total_seconds() if pd.notna(row['LapTime']) else None,
                'compound':     _safe_val(row['Compound']),
                'tyre_life':    _safe_val(row['TyreLife']),
                'pit_out_lap':  bool(row['PitOutLap']),
                'pit_in_lap':   bool(row['PitInLap']),
            }
            for _, row in laps.iterrows()
        ]
    except Exception as e:
        logger.error(f"FastF1 laps error ({year} R{round}): {e}")
        return []


# ─── Session Results ──────────────────────────────────────────────────────────

def get_session_results(year: int, round: int) -> list:
    try:
        session = fastf1.get_session(year, round, 'R')
        session.load(laps=False, telemetry=False, weather=False)
        results = session.results
        return [
            {
                'position':     _safe_val(row['Position']),
                'driver_code':  row['Abbreviation'],
                'driver_name':  row['FullName'],
                'team':         row['TeamName'],
                'points':       _safe_val(row['Points']),
                'status':       row['Status'],
                'grid_pos':     _safe_val(row['GridPosition']),
            }
            for _, row in results.iterrows()
        ]
    except Exception as e:
        logger.error(f"FastF1 results error ({year} R{round}): {e}")
        return []


# ─── Standings ───────────────────────────────────────────────────────────────

def get_standings(year: int) -> dict:
    """Driver & Constructor standings from Ergast mirror (Jolpica)."""
    try:
        import requests
        drivers_url = f"https://api.jolpi.ca/ergast/f1/{year}/driverStandings.json"
        cons_url = f"https://api.jolpi.ca/ergast/f1/{year}/constructorStandings.json"

        d_res = requests.get(drivers_url, timeout=10).json()
        c_res = requests.get(cons_url, timeout=10).json()

        d_standings = d_res.get('MRData', {}).get('StandingsTable', {}).get('StandingsLists', [])
        c_standings = c_res.get('MRData', {}).get('StandingsTable', {}).get('StandingsLists', [])

        drivers = []
        if d_standings and d_standings[0].get('DriverStandings'):
            drv_list = d_standings[0]['DriverStandings']
            leader_pts = float(drv_list[0].get('points', 0))
            for row in drv_list:
                pts = float(row.get('points', 0))
                driver = row.get('Driver', {})
                teams = row.get('Constructors', [])
                team_name = teams[0].get('name', '') if teams else ''
                drivers.append({
                    'position':       int(row.get('position', 0)),
                    'driver_code':    driver.get('code') or driver.get('driverId'),
                    'driver_name':    f"{driver.get('givenName','')} {driver.get('familyName','')}".strip(),
                    'team_name':      team_name,
                    'points':         pts,
                    'wins':           int(row.get('wins', 0)),
                    'gap_to_leader':  0 if int(row.get('position', 0)) == 1 else leader_pts - pts,
                })

        constructors = []
        if c_standings and c_standings[0].get('ConstructorStandings'):
            con_list = c_standings[0]['ConstructorStandings']
            leader_pts = float(con_list[0].get('points', 0))
            for row in con_list:
                pts = float(row.get('points', 0))
                team = row.get('Constructor', {})
                constructors.append({
                    'position':      int(row.get('position', 0)),
                    'team_name':     team.get('name', ''),
                    'points':        pts,
                    'wins':          int(row.get('wins', 0)),
                    'gap_to_leader': 0 if int(row.get('position', 0)) == 1 else leader_pts - pts,
                })

        return {'drivers': drivers, 'constructors': constructors}

    except Exception as e:
        logger.error(f"Standings API error ({year}): {e}")
        return {'drivers': [], 'constructors': []}


# ─── Calendar ─────────────────────────────────────────────────────────────────

def get_calendar(year: int) -> list:
    try:
        schedule = fastf1.get_event_schedule(year)
        events = []
        for _, row in schedule.iterrows():
            round_num = _safe_val(row.get('RoundNumber'))
            if not round_num or round_num == 0:
                continue  # Skip pre-season testing entries
            events.append({
                'round_number':  round_num,
                'event_name':    row.get('EventName'),
                'country':       row.get('Country'),
                'location':      row.get('Location'),
                'event_format':  row.get('EventFormat'),
                'session5_date': str(row.get('Session5DateUtc', '')) if row.get('Session5DateUtc') is not None else None,
            })
        return events
    except Exception as e:
        logger.error(f"FastF1 calendar error ({year}): {e}")
        return []


# ─── Circuit History ──────────────────────────────────────────────────────────

# Map from circuit_id → partial event name for search
CIRCUIT_GP_MAP = {
    'bahrain':      'Bahrain',
    'saudi_arabia': 'Saudi',
    'australia':    'Australian',
    'japan':        'Japanese',
    'china':        'Chinese',
    'miami':        'Miami',
    'imola':        'Emilia',
    'monaco':       'Monaco',
    'canada':       'Canadian',
    'spain':        'Spanish',
    'austria':      'Austrian',
    'silverstone':  'British',
    'hungary':      'Hungarian',
    'spa':          'Belgian',
    'zandvoort':    'Dutch',
    'monza':        'Italian',
    'baku':         'Azerbaijan',
    'singapore':    'Singapore',
    'austin':       'United States',
    'mexico':       'Mexico',
    'brazil':       'São Paulo',
    'vegas':        'Las Vegas',
    'qatar':        'Qatar',
    'abu_dhabi':    'Abu Dhabi',
}


def get_circuit_history(circuit_id: str) -> list:
    """Get race winners from last 5 years at a circuit."""
    gp_name = CIRCUIT_GP_MAP.get(circuit_id.lower(), circuit_id)
    import datetime
    current_year = datetime.date.today().year
    results = []
    for year in range(current_year - 1, current_year - 7, -1):
        try:
            schedule = fastf1.get_event_schedule(year)
            event = schedule[
                schedule['EventName'].str.contains(gp_name, case=False, na=False) |
                schedule['Country'].str.contains(gp_name, case=False, na=False)
            ]
            if event.empty:
                continue
            round_num = int(event.iloc[0]['RoundNumber'])
            session = fastf1.get_session(year, round_num, 'R')
            session.load(laps=False, telemetry=False, weather=False)
            winner = session.results.iloc[0]
            results.append({
                'year':   year,
                'winner': winner.get('FullName', ''),
                'team':   winner.get('TeamName', ''),
            })
        except Exception:
            continue
    return results


# ─── Circuit Topology (for 2D SVG rendering) ─────────────────────────────────

def get_circuit_topology(year: int, round_num: int) -> list:
    """Load fastest qualifying lap telemetry to extract X, Y track trace."""
    try:
        session = fastf1.get_session(year, round_num, 'Q')
        session.load(laps=True, telemetry=True, weather=False, messages=False)
        fastest_lap = session.laps.pick_fastest()
        if fastest_lap is None or pd.isna(fastest_lap['LapTime']):
            return []
        telemetry = fastest_lap.get_telemetry()
        # 1 in 8 points gives a smooth yet lightweight SVG
        sampled = telemetry.iloc[::8]
        points = [
            {'x': _safe_val(row['X']), 'y': _safe_val(row['Y'])}
            for _, row in sampled.iterrows()
            if not pd.isna(row['X']) and not pd.isna(row['Y'])
        ]
        return points
    except Exception as e:
        logger.error(f"FastF1 topology error ({year} R{round_num}): {e}")
        return []


def get_circuit_topology_by_id(circuit_id: str) -> list:
    """Find the most recent year the circuit was run and fetch its topology."""
    import datetime
    current_year = datetime.date.today().year
    gp_name = CIRCUIT_GP_MAP.get(circuit_id.lower(), circuit_id)

    for year in range(current_year - 1, current_year - 7, -1):
        try:
            schedule = fastf1.get_event_schedule(year)
            event = schedule[
                schedule['EventName'].str.contains(gp_name, case=False, na=False) |
                schedule['Country'].str.contains(gp_name, case=False, na=False) |
                schedule['Location'].str.contains(gp_name, case=False, na=False)
            ]
            if not event.empty:
                round_num = int(event.iloc[0]['RoundNumber'])
                data = get_circuit_topology(year, round_num)
                if data:
                    return data
        except Exception:
            continue
    return []


# ─── Telemetry Comparison (H2H) ───────────────────────────────────────────────

def get_telemetry_comparison(year: int, round_num: int, driver1: str, driver2: str) -> dict:
    """Fetch fastest qualifying lap telemetry for two drivers and return downsampled trace."""
    try:
        session = fastf1.get_session(year, round_num, 'Q')
        session.load(laps=True, telemetry=True, weather=False, messages=False)

        result = {}
        for code in [driver1, driver2]:
            try:
                laps = session.laps.pick_driver(code)
                if laps.empty:
                    result[code] = {'telemetry': [], 'lap_time': None}
                    continue
                fastest = laps.pick_fastest()
                if fastest is None or pd.isna(fastest['LapTime']):
                    result[code] = {'telemetry': [], 'lap_time': None}
                    continue
                tel = fastest.get_telemetry().add_distance()
                # Downsample to ~200 points max
                step = max(1, len(tel) // 200)
                sampled = tel.iloc[::step]
                points = []
                for _, row in sampled.iterrows():
                    points.append({
                        'distance': _safe_val(row.get('Distance')),
                        'speed':    _safe_val(row.get('Speed')),
                        'throttle': _safe_val(row.get('Throttle')),
                        'brake':    bool(row.get('Brake', False)),
                        'gear':     _safe_val(row.get('nGear')),
                        'rpm':      _safe_val(row.get('RPM')),
                    })
                lt = fastest['LapTime'].total_seconds() if pd.notna(fastest['LapTime']) else None
                result[code] = {'telemetry': points, 'lap_time': lt}
            except Exception as inner:
                logger.error(f"Telemetry for {code}: {inner}")
                result[code] = {'telemetry': [], 'lap_time': None}

        return result

    except Exception as e:
        logger.error(f"FastF1 compare error ({year} R{round_num}, {driver1} vs {driver2}): {e}")
        return {driver1: {'telemetry': [], 'lap_time': None}, driver2: {'telemetry': [], 'lap_time': None}}


# ─── All-time Driver & Constructor Databases ──────────────────────────────────

def get_all_drivers() -> list:
    """Fetch all-time F1 drivers via Ergast with pagination."""
    try:
        import requests
        all_drivers = []
        limit = 100
        offset = 0
        total = 999  # Placeholder, will be updated from response

        while offset < total:
            url = f'https://api.jolpi.ca/ergast/f1/drivers.json?limit={limit}&offset={offset}'
            r = requests.get(url, timeout=15)
            r.raise_for_status()
            data = r.json().get('MRData', {})
            
            drivers = data.get('DriverTable', {}).get('Drivers', [])
            if not drivers:
                break
                
            total = int(data.get('total', 0))
            
            for d in drivers:
                all_drivers.append({
                    'driver_id':  d.get('driverId', ''),
                    'code':       d.get('code', ''),
                    'full_name':  f"{d.get('givenName','')} {d.get('familyName','')}".strip(),
                    'nationality':d.get('nationality', ''),
                    'dob':        d.get('dateOfBirth', ''),
                })
            
            offset += limit
            if offset >= total:
                break
                
        return all_drivers
    except Exception as e:
        logger.error(f"Ergast drivers error: {e}")
        return []


def get_all_constructors() -> list:
    """Fetch all-time F1 constructors via Ergast with pagination."""
    try:
        import requests
        all_constructors = []
        limit = 100
        offset = 0
        total = 999

        while offset < total:
            url = f'https://api.jolpi.ca/ergast/f1/constructors.json?limit={limit}&offset={offset}'
            r = requests.get(url, timeout=15)
            r.raise_for_status()
            data = r.json().get('MRData', {})
            
            constructors = data.get('ConstructorTable', {}).get('Constructors', [])
            if not constructors:
                break
                
            total = int(data.get('total', 0))
            
            for c in constructors:
                all_constructors.append({
                    'constructor_id': c.get('constructorId', ''),
                    'name':           c.get('name', ''),
                    'nationality':    c.get('nationality', ''),
                })
            
            offset += limit
            if offset >= total:
                break

        return all_constructors
    except Exception as e:
        logger.error(f"Ergast constructors error: {e}")
        return []

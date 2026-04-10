"""
backend/routes/circuit.py
Circuit info, topology, and historical data.
Now supports all 24 circuits listed in the frontend.
"""
import asyncio
from fastapi import APIRouter, HTTPException, Depends
from backend.services import fastf1_service as ff1
from backend.dependencies import require_auth

# Comprehensive circuit data for all current & recent F1 circuits
CIRCUIT_INFO = {
    'bahrain':     {'name': 'Bahrain International Circuit',       'country': 'Bahrain',    'city': 'Sakhir',        'length_km': 5.412, 'turns': 15, 'drs_zones': 3, 'lap_record': '1:31.447', 'lap_record_driver': 'Pedro de la Rosa',   'lap_record_year': 2005},
    'saudi_arabia':{'name': 'Jeddah Corniche Circuit',             'country': 'Saudi Arabia','city': 'Jeddah',        'length_km': 6.174, 'turns': 27, 'drs_zones': 3, 'lap_record': '1:30.734', 'lap_record_driver': 'Lewis Hamilton',       'lap_record_year': 2021},
    'australia':   {'name': 'Albert Park Circuit',                 'country': 'Australia',  'city': 'Melbourne',     'length_km': 5.303, 'turns': 16, 'drs_zones': 4, 'lap_record': '1:20.235', 'lap_record_driver': 'Charles Leclerc',      'lap_record_year': 2022},
    'japan':       {'name': 'Suzuka International Racing Course',  'country': 'Japan',      'city': 'Suzuka',        'length_km': 5.807, 'turns': 18, 'drs_zones': 1, 'lap_record': '1:30.983', 'lap_record_driver': 'Lewis Hamilton',       'lap_record_year': 2019},
    'china':       {'name': 'Shanghai International Circuit',      'country': 'China',      'city': 'Shanghai',      'length_km': 5.451, 'turns': 16, 'drs_zones': 2, 'lap_record': '1:32.238', 'lap_record_driver': 'Michael Schumacher',   'lap_record_year': 2004},
    'miami':       {'name': 'Miami International Autodrome',       'country': 'USA',        'city': 'Miami Gardens','length_km': 5.412, 'turns': 19, 'drs_zones': 3, 'lap_record': '1:29.708', 'lap_record_driver': 'Max Verstappen',       'lap_record_year': 2023},
    'imola':       {'name': 'Autodromo Enzo e Dino Ferrari',       'country': 'Italy',      'city': 'Imola',         'length_km': 4.909, 'turns': 19, 'drs_zones': 1, 'lap_record': '1:15.484', 'lap_record_driver': 'Valtteri Bottas',      'lap_record_year': 2020},
    'monaco':      {'name': 'Circuit de Monaco',                   'country': 'Monaco',     'city': 'Monte Carlo',  'length_km': 3.337, 'turns': 19, 'drs_zones': 1, 'lap_record': '1:10.166', 'lap_record_driver': 'Lewis Hamilton',       'lap_record_year': 2021},
    'canada':      {'name': 'Circuit Gilles Villeneuve',           'country': 'Canada',     'city': 'Montreal',      'length_km': 4.361, 'turns': 14, 'drs_zones': 2, 'lap_record': '1:13.078', 'lap_record_driver': 'Valtteri Bottas',      'lap_record_year': 2019},
    'spain':       {'name': 'Circuit de Barcelona-Catalunya',      'country': 'Spain',      'city': 'Barcelona',     'length_km': 4.657, 'turns': 14, 'drs_zones': 2, 'lap_record': '1:16.330', 'lap_record_driver': 'Max Verstappen',       'lap_record_year': 2023},
    'austria':     {'name': 'Red Bull Ring',                       'country': 'Austria',    'city': 'Spielberg',     'length_km': 4.318, 'turns': 10, 'drs_zones': 3, 'lap_record': '1:05.619', 'lap_record_driver': 'Carlos Sainz',         'lap_record_year': 2020},
    'silverstone': {'name': 'Silverstone Circuit',                 'country': 'Great Britain','city': 'Silverstone', 'length_km': 5.891, 'turns': 18, 'drs_zones': 2, 'lap_record': '1:27.097', 'lap_record_driver': 'Max Verstappen',       'lap_record_year': 2020},
    'hungary':     {'name': 'Hungaroring',                        'country': 'Hungary',    'city': 'Budapest',      'length_km': 4.381, 'turns': 14, 'drs_zones': 1, 'lap_record': '1:16.627', 'lap_record_driver': 'Lewis Hamilton',       'lap_record_year': 2020},
    'spa':         {'name': 'Circuit de Spa-Francorchamps',        'country': 'Belgium',    'city': 'Stavelot',      'length_km': 7.004, 'turns': 19, 'drs_zones': 2, 'lap_record': '1:46.286', 'lap_record_driver': 'Valtteri Bottas',      'lap_record_year': 2018},
    'zandvoort':   {'name': 'Circuit Zandvoort',                   'country': 'Netherlands','city': 'Zandvoort',     'length_km': 4.259, 'turns': 14, 'drs_zones': 2, 'lap_record': '1:11.097', 'lap_record_driver': 'Max Verstappen',       'lap_record_year': 2021},
    'monza':       {'name': 'Autodromo Nazionale Monza',           'country': 'Italy',      'city': 'Monza',         'length_km': 5.793, 'turns': 11, 'drs_zones': 3, 'lap_record': '1:21.046', 'lap_record_driver': 'Rubens Barrichello',   'lap_record_year': 2004},
    'baku':        {'name': 'Baku City Circuit',                   'country': 'Azerbaijan', 'city': 'Baku',          'length_km': 6.003, 'turns': 20, 'drs_zones': 2, 'lap_record': '1:43.009', 'lap_record_driver': 'Charles Leclerc',      'lap_record_year': 2019},
    'singapore':   {'name': 'Marina Bay Street Circuit',           'country': 'Singapore',  'city': 'Singapore',     'length_km': 5.063, 'turns': 23, 'drs_zones': 3, 'lap_record': '1:41.905', 'lap_record_driver': 'Lewis Hamilton',       'lap_record_year': 2023},
    'austin':      {'name': 'Circuit of the Americas',             'country': 'USA',        'city': 'Austin',        'length_km': 5.513, 'turns': 20, 'drs_zones': 2, 'lap_record': '1:36.169', 'lap_record_driver': 'Charles Leclerc',      'lap_record_year': 2019},
    'mexico':      {'name': 'Autodromo Hermanos Rodriguez',        'country': 'Mexico',     'city': 'Mexico City',   'length_km': 4.304, 'turns': 17, 'drs_zones': 3, 'lap_record': '1:17.774', 'lap_record_driver': 'Valtteri Bottas',      'lap_record_year': 2021},
    'brazil':      {'name': 'Autodromo Jose Carlos Pace',          'country': 'Brazil',     'city': 'São Paulo',     'length_km': 4.309, 'turns': 15, 'drs_zones': 2, 'lap_record': '1:10.540', 'lap_record_driver': 'Valtteri Bottas',      'lap_record_year': 2018},
    'vegas':       {'name': 'Las Vegas Street Circuit',            'country': 'USA',        'city': 'Las Vegas',     'length_km': 6.201, 'turns': 17, 'drs_zones': 2, 'lap_record': '1:35.490', 'lap_record_driver': 'Oscar Piastri',        'lap_record_year': 2023},
    'qatar':       {'name': 'Lusail International Circuit',        'country': 'Qatar',      'city': 'Lusail',        'length_km': 5.419, 'turns': 16, 'drs_zones': 2, 'lap_record': '1:24.319', 'lap_record_driver': 'Max Verstappen',       'lap_record_year': 2023},
    'abu_dhabi':   {'name': 'Yas Marina Circuit',                  'country': 'UAE',        'city': 'Abu Dhabi',     'length_km': 5.281, 'turns': 16, 'drs_zones': 2, 'lap_record': '1:26.103', 'lap_record_driver': 'Max Verstappen',       'lap_record_year': 2021},
}

router = APIRouter()


@router.get('/{circuit_id}')
async def get_circuit_info(circuit_id: str, user=Depends(require_auth)):
    """Circuit metadata."""
    info = CIRCUIT_INFO.get(circuit_id.lower())
    if not info:
        # Return minimal stub instead of 404 so frontend doesn't break
        return {'circuit_id': circuit_id, 'name': circuit_id.replace('_', ' ').title()}
    return {'circuit_id': circuit_id, **info}


@router.get('/{circuit_id}/history')
async def get_history(circuit_id: str, user=Depends(require_auth)):
    """Race winner history for a circuit."""
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(None, ff1.get_circuit_history, circuit_id)
    return data


@router.get('/{circuit_id}/topology')
async def get_topology(circuit_id: str, user=Depends(require_auth)):
    """2D SVG telemetry coordinates for any historical circuit."""
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(None, ff1.get_circuit_topology_by_id, circuit_id)
    return data

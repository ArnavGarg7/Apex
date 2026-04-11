"""
backend/services/weather_service.py
OpenWeatherMap integration for circuit weather — all 24 F1 tracks.
"""
import httpx
from backend.config import get_settings

# Comprehensive coordinate-based lookup for all 24 F1 circuits.
# Using GPS lat/lon via OWM's /weather?lat=&lon= for maximum accuracy.
CIRCUIT_COORDS = {
    'bahrain':      (26.0325,  50.5106),   # Bahrain International Circuit, Sakhir
    'saudi_arabia': (21.6319,  39.1044),   # Jeddah Corniche Circuit
    'australia':    (-37.8497, 144.9680),  # Albert Park, Melbourne
    'japan':        (34.8431,  136.5407),  # Suzuka International
    'china':        (31.3389,  121.2199),  # Shanghai International
    'miami':        (25.9582,  -80.2389),  # Miami International Autodrome
    'imola':        (44.3439,  11.7167),   # Autodromo Enzo e Dino Ferrari
    'monaco':       (43.7347,   7.4206),   # Circuit de Monaco
    'canada':       (45.5000,  -73.5228),  # Circuit Gilles Villeneuve, Montreal
    'spain':        (41.5700,   2.2611),   # Circuit de Barcelona-Catalunya
    'austria':      (47.2197,  14.7647),   # Red Bull Ring, Spielberg
    'silverstone':  (52.0786,  -1.0169),   # Silverstone Circuit
    'hungary':      (47.5789,  19.2486),   # Hungaroring, Budapest
    'spa':          (50.4372,   5.9714),   # Spa-Francorchamps
    'zandvoort':    (52.3888,   4.5407),   # Circuit Zandvoort
    'monza':        (45.6156,   9.2811),   # Autodromo Nazionale Monza
    'baku':         (40.3725,  49.8533),   # Baku City Circuit
    'singapore':    (1.2914,   103.8640),  # Marina Bay Street Circuit
    'austin':       (30.1328,  -97.6411),  # Circuit of the Americas
    'mexico':       (19.4042,  -99.0907),  # Autodromo Hermanos Rodriguez
    'brazil':       (-23.7036, -46.6997),  # Autodromo Jose Carlos Pace, Sao Paulo
    'vegas':        (36.1147, -115.1728),  # Las Vegas Street Circuit
    'qatar':        (25.4900,  51.4542),   # Lusail International Circuit
    'abu_dhabi':    (24.4672,  54.6031),   # Yas Marina Circuit
}

# Human-readable city/country fallback for display purposes
CIRCUIT_DISPLAY = {
    'bahrain':      ('Sakhir', 'BH'),
    'saudi_arabia': ('Jeddah', 'SA'),
    'australia':    ('Melbourne', 'AU'),
    'japan':        ('Suzuka', 'JP'),
    'china':        ('Shanghai', 'CN'),
    'miami':        ('Miami Gardens', 'US'),
    'imola':        ('Imola', 'IT'),
    'monaco':       ('Monte Carlo', 'MC'),
    'canada':       ('Montreal', 'CA'),
    'spain':        ('Barcelona', 'ES'),
    'austria':      ('Spielberg', 'AT'),
    'silverstone':  ('Silverstone', 'GB'),
    'hungary':      ('Budapest', 'HU'),
    'spa':          ('Stavelot', 'BE'),
    'zandvoort':    ('Zandvoort', 'NL'),
    'monza':        ('Monza', 'IT'),
    'baku':         ('Baku', 'AZ'),
    'singapore':    ('Singapore', 'SG'),
    'austin':       ('Austin', 'US'),
    'mexico':       ('Mexico City', 'MX'),
    'brazil':       ('São Paulo', 'BR'),
    'vegas':        ('Las Vegas', 'US'),
    'qatar':        ('Lusail', 'QA'),
    'abu_dhabi':    ('Abu Dhabi', 'AE'),
}

OWM_BASE = 'https://api.openweathermap.org/data/2.5'


def _track_temp_estimate(air_temp: float, condition_id: int, uv_index: float = None) -> float:
    """
    Estimate track surface temperature. Track is typically 10-20°C above air temp
    depending on whether it's sunny or overcast.
    """
    # Thunderstorm / rain → smaller delta (3-7°C); clear sky → large delta (15-20°C)
    if condition_id < 300:        # Thunderstorm
        delta = 4
    elif condition_id < 600:      # Rain / drizzle
        delta = 5
    elif condition_id < 700:      # Snow
        delta = 2
    elif condition_id < 800:      # Atmosphere (fog, mist)
        delta = 7
    elif condition_id == 800:     # Clear sky
        delta = 18
    elif condition_id == 801:     # Few clouds
        delta = 14
    elif condition_id == 802:     # Scattered clouds
        delta = 11
    else:                         # Broken/overcast clouds
        delta = 8
    return round(air_temp + delta, 1)


async def get_weather_for_circuit(circuit_id: str) -> dict:
    settings = get_settings()
    cid = circuit_id.lower()
    coords = CIRCUIT_COORDS.get(cid)
    city, country = CIRCUIT_DISPLAY.get(cid, ('Unknown', 'XX'))

    # --- Fallback if no API key ---
    if not settings.OPENWEATHER_API_KEY:
        return {
            'circuit_id':        circuit_id,
            'city':              city,
            'country':           country,
            'temperature_air':   22.5,
            'temperature_track': 40.5,
            'feels_like':        23.0,
            'humidity':          45,
            'pressure':          1012,
            'wind_speed':        12.5,
            'wind_direction':    270,
            'condition':         'Clear Sky (Simulated)',
            'condition_icon':    '01d',
            'rain_chance':       5,
            'visibility':        10.0,
            'source':            'simulated',
        }

    # --- Build params: use lat/lon if available, fall back to city name ---
    if coords:
        params = {
            'lat':   coords[0],
            'lon':   coords[1],
            'appid': settings.OPENWEATHER_API_KEY,
            'units': 'metric',
        }
    else:
        params = {
            'q':     f'{city},{country}',
            'appid': settings.OPENWEATHER_API_KEY,
            'units': 'metric',
        }

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(f'{OWM_BASE}/weather', params=params)
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            return {
                'circuit_id': circuit_id,
                'city': city, 'country': country,
                'temperature_air': 20, 'temperature_track': 35,
                'feels_like': 20, 'humidity': 50,
                'wind_speed': 10, 'wind_direction': 0,
                'condition': f'Offline: {str(e)[:40]}',
                'condition_icon': '03d',
                'rain_chance': 0, 'visibility': 10.0,
                'source': 'error',
            }

        # Also grab the /forecast endpoint for probability-of-precipitation (POP)
        # /weather.rain.1h is only available when it IS raining — not useful as a chance metric
        pop_percent = 0
        try:
            fcast_resp = await client.get(f'{OWM_BASE}/forecast', params={**params, 'cnt': 2})
            if fcast_resp.status_code == 200:
                fcast_data = fcast_resp.json()
                buckets = fcast_data.get('list', [])
                if buckets:
                    # Take the MAX pop from the first two 3h buckets (next 6h window)
                    pop = max(b.get('pop', 0) for b in buckets)
                    pop_percent = round(pop * 100, 1)
        except Exception:
            pass  # fall through — pop_percent remains 0

    condition_id = data['weather'][0]['id']
    air_temp = data['main']['temp']
    humidity = data['main']['humidity']

    # Derive a condition-based rain probability from current OWM weather code.
    # This ensures that if it IS raining right now, we show a high probability
    # even if the 3-hour forecast bucket says 0 (e.g. just started raining).
    if condition_id < 300:          # Thunderstorm
        cond_pop = 100
    elif condition_id < 400:        # Drizzle
        cond_pop = 85
    elif condition_id < 600:        # Rain
        cond_pop = 95
    elif condition_id < 700:        # Snow
        cond_pop = 90
    elif condition_id < 800:        # Atmosphere (fog, mist) — some moisture
        cond_pop = max(30, round(humidity * 0.4))
    elif condition_id == 800:       # Clear sky
        cond_pop = max(0, round((humidity - 60) * 0.3)) if humidity > 60 else 0
    elif condition_id == 801:       # Few clouds
        cond_pop = max(5, round((humidity - 50) * 0.25)) if humidity > 50 else 5
    elif condition_id == 802:       # Scattered clouds
        cond_pop = max(10, round(humidity * 0.2))
    elif condition_id == 803:       # Broken clouds
        cond_pop = max(20, round(humidity * 0.3))
    else:                           # Overcast
        cond_pop = max(30, round(humidity * 0.45))

    # Final rain_chance: take the highest of forecast PoP and current-condition estimate
    rain_chance = max(pop_percent, cond_pop)

    return {
        'circuit_id':        circuit_id,
        'city':              city,
        'country':           country,
        'temperature_air':   round(air_temp, 1),
        'temperature_track': _track_temp_estimate(air_temp, condition_id),
        'feels_like':        round(data['main']['feels_like'], 1),
        'humidity':          humidity,
        'pressure':          data['main']['pressure'],
        'wind_speed':        round(data['wind']['speed'] * 3.6, 1),  # m/s → km/h
        'wind_direction':    data['wind'].get('deg', 0),
        'condition':         data['weather'][0]['description'].title(),
        'condition_icon':    data['weather'][0]['icon'],
        'rain_chance':       rain_chance,
        'visibility':        round(data.get('visibility', 10000) / 1000, 1),
        'source':            'openweathermap',
    }


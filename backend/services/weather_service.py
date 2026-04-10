"""
backend/services/weather_service.py
OpenWeatherMap integration for circuit weather.
"""
import httpx
from backend.config import get_settings

CIRCUIT_CITIES = {
    'monaco':    ('Monte Carlo', 'MC'),
    'silverstone': ('Silverstone', 'GB'),
    'monza':     ('Monza', 'IT'),
    'spa':       ('Stavelot', 'BE'),
    'suzuka':    ('Suzuka', 'JP'),
    'bahrain':   ('Sakhir', 'BH'),
    'abu_dhabi': ('Abu Dhabi', 'AE'),
    'singapore': ('Singapore', 'SG'),
    'canada':    ('Montreal', 'CA'),
    'miami':     ('Miami Gardens', 'US'),
    'austin':    ('Austin', 'US'),
    'zandvoort': ('Zandvoort', 'NL'),
    'barcelona': ('Barcelona', 'ES'),
    'hungaroring': ('Budapest', 'HU'),
    'baku':      ('Baku', 'AZ'),
    'melbourne': ('Melbourne', 'AU'),
}

OWM_BASE = 'https://api.openweathermap.org/data/2.5'


async def get_weather_for_circuit(circuit_id: str) -> dict:
    settings = get_settings()
    city, country = CIRCUIT_CITIES.get(circuit_id.lower(), ('Monaco', 'MC'))

    if not settings.OPENWEATHER_API_KEY:
        # Maintenance mode / Fallback for dev
        return {
            'circuit_id':        circuit_id,
            'city':              city,
            'country':           country,
            'temperature_air':   22.5,
            'temperature_track': 31.0,
            'feels_like':        23.0,
            'humidity':          45,
            'pressure':          1012,
            'wind_speed':        12.5,
            'wind_direction':    270,
            'condition':         'Clear Sky (Simulated)',
            'condition_icon':    '01d',
            'rain_chance':       5,
            'visibility':        10.0,
        }

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(f'{OWM_BASE}/weather', params={
                'q':     f'{city},{country}',
                'appid': settings.OPENWEATHER_API_KEY,
                'units': 'metric',
            })
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            # Final fallback for network/API errors
            return {
                'circuit_id': circuit_id,
                'city': city, 'country': country,
                'temperature_air': 20, 'temperature_track': 28,
                'condition': f'Offline: {str(e)[:20]}', 'condition_icon': '03d',
                'humidity': 50, 'wind_speed': 10, 'wind_direction': 0, 'rain_chance': 0,
            }

        return {
            'circuit_id':        circuit_id,
            'city':              city,
            'country':           country,
            'temperature_air':   data['main']['temp'],
            'temperature_track': data['main']['temp'] + 8,  # Track ≈ air + ~8°C estimate
            'feels_like':        data['main']['feels_like'],
            'humidity':          data['main']['humidity'],
            'pressure':          data['main']['pressure'],
            'wind_speed':        data['wind']['speed'] * 3.6,  # m/s → km/h
            'wind_direction':    data['wind'].get('deg', 0),
            'condition':         data['weather'][0]['description'].title(),
            'condition_icon':    data['weather'][0]['icon'],
            'rain_chance':       data.get('rain', {}).get('1h', 0) * 100 if 'rain' in data else 0,
            'visibility':        data.get('visibility', 10000) / 1000,  # m → km
        }

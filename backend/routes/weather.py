"""
backend/routes/weather.py
Weather for a circuit via OpenWeatherMap.
"""
from fastapi import APIRouter, HTTPException, Depends
from backend.services.weather_service import get_weather_for_circuit
from backend.dependencies import require_auth

router = APIRouter()


@router.get('/{circuit_id}')
async def get_weather(circuit_id: str, user=Depends(require_auth)):
    """Current weather and forecast for a circuit city."""
    try:
        data = await get_weather_for_circuit(circuit_id)
        return data
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

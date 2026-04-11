"""
backend/routes/historical.py
Historical race data via FastF1.
"""
import asyncio
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from backend.services import fastf1_service as ff1
from backend.dependencies import require_auth

router = APIRouter()


@router.get('/laps')
async def get_laps(year: int, round: int, driver: Optional[str] = None,
                   user=Depends(require_auth)):
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(None, ff1.get_race_laps, year, round, driver)
    return data


@router.get('/results')
async def get_results(year: int, round: int, user=Depends(require_auth)):
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(None, ff1.get_session_results, year, round)
    return data


@router.get('/circuit-history/{circuit_id}')
async def get_circuit_history(circuit_id: str, user=Depends(require_auth)):
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(None, ff1.get_circuit_history, circuit_id)
    return data


@router.get('/telemetry-compare')
async def get_telemetry_compare(year: int, round: int, driver1: str, driver2: str, user=Depends(require_auth)):
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(None, ff1.get_telemetry_comparison, year, round, driver1, driver2)
    return data


@router.get('/race-pace')
async def get_race_pace(year: int, round: int, driver1: str, driver2: str, user=Depends(require_auth)):
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(None, ff1.get_race_pace_comparison, year, round, driver1, driver2)
    return data


@router.get('/drivers')
async def get_drivers(user=Depends(require_auth)):
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(None, ff1.get_all_drivers)
    return data
bio_cache = {}

@router.get('/driver-bio/{driver_id}')
async def get_driver_bio(driver_id: str, name: str = "", user=Depends(require_auth)):
    if driver_id in bio_cache:
        return bio_cache[driver_id]

    # Generate an AI bio for the driver using Gemini (cached so it doesn't spam)
    from backend.config import get_settings
    settings = get_settings()
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        fallback = {"bio": f"{name} is a Formula 1 driver. (Gemini API key missing)", "legacy_score": 75}
        bio_cache[driver_id] = fallback
        return fallback
        
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        
        prompt = (
            f"Write a 3-sentence career summary for Formula 1 driver {name} (ID: {driver_id}). "
            "Focus on their most significant achievements, driving style, or era they raced in. "
            "Also, output a 'legacy_score' from 1 to 100 based on their historical F1 impact (e.g. Schumacher/Hamilton = 99, 1-race rookies = 20). "
            "Return EXACTLY this JSON format and nothing else: {\"bio\": \"...\", \"legacy_score\": 85}"
        )
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
        )
        import re, json
        raw = response.text.strip()
        raw = re.sub(r'^```(?:json)?\s*', '', raw)
        raw = re.sub(r'\s*```$', '', raw).strip()
        
        match = re.search(r'\{.+\}', raw, re.DOTALL)
        if match:
            raw = match.group(0)
            
        data = json.loads(raw)
        result = {"bio": data.get("bio", "Bio unavailable."), "legacy_score": data.get("legacy_score", 50)}
        bio_cache[driver_id] = result
        return result
    except Exception as e:
        error_result = {"bio": f"{name} is a Formula 1 driver. Detailed AI biography is currently delayed due to F1 data link limits (API quota).", "legacy_score": 70}
        return error_result



@router.get('/constructors')
async def get_constructors(user=Depends(require_auth)):
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(None, ff1.get_all_constructors)
    return data

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


@router.get('/drivers')
async def get_drivers(user=Depends(require_auth)):
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(None, ff1.get_all_drivers)
    return data


@router.get('/constructors')
async def get_constructors(user=Depends(require_auth)):
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(None, ff1.get_all_constructors)
    return data

"""
backend/routes/calendar.py
Race calendar via FastF1.
"""
import asyncio
from fastapi import APIRouter, HTTPException, Depends
from backend.services import fastf1_service as ff1
from backend.dependencies import require_auth

router = APIRouter()


@router.get('/{year}')
async def get_calendar(year: int, user=Depends(require_auth)):
    """Race calendar for a season."""
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(None, ff1.get_calendar, year)
    return data

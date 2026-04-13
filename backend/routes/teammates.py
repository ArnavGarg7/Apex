"""
backend/routes/teammates.py
Teammate head-to-head dominance statistics for a given season.
"""
import asyncio
import logging
from fastapi import APIRouter, Query
from backend.services import fastf1_service as ff1

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get('/battle')
async def teammate_battle(year: int = Query(2025)):
    """
    Returns per-constructor teammate pairing with:
    - qualifying gap statistics (avg delta, rounds won by each)
    - race win counts
    - points split
    """
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(None, ff1.get_teammate_battle, year)
    return data

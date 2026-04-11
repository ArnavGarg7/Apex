"""
backend/routes/simulate.py
API endpoints for Championship Probability Monte Carlo simulations.
"""
import asyncio
from fastapi import APIRouter, Depends
from backend.services.simulation_service import simulate_championship
from backend.dependencies import require_auth

router = APIRouter()

@router.get('/monte-carlo')
async def get_monte_carlo(year: int, remaining: int = 5, user=Depends(require_auth)):
    loop = asyncio.get_event_loop()
    # Run in executor because fetching standings in simulate_championship is synchronous right now
    data = await loop.run_in_executor(None, simulate_championship, year, remaining, 1000)
    return data

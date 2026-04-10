"""
backend/routes/simulate.py
Undercut simulation endpoint (delegates to strategy route logic).
"""
from fastapi import APIRouter, Depends
from backend.schemas import UndercutRequest
from backend.routes.strategy import simulate_undercut as _simulate
from backend.dependencies import require_auth

router = APIRouter()


@router.post('/undercut')
async def undercut(body: UndercutRequest, user=Depends(require_auth)):
    return await _simulate(body, user)

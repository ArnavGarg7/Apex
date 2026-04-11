"""
backend/routes/radio.py
Analyzed remote messages and race control sentiments
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from backend.services.radio_service import get_analyzed_race_control
from backend.services import openf1_service as openf1
from backend.dependencies import require_auth

router = APIRouter()

@router.get('/sentiment')
async def get_radio_sentiment(session_key: Optional[int] = None, user=Depends(require_auth)):
    if not session_key:
        session_key = await openf1.get_latest_session_key()
    if not session_key:
        raise HTTPException(status_code=404, detail='No active session')

    messages = await get_analyzed_race_control(session_key)
    return messages

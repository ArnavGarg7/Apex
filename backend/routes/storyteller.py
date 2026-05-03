"""
backend/routes/storyteller.py
AI Post-Race Story generation using Gemini, with file-based caching.
"""
import os
import json
import asyncio
import logging
from pathlib import Path
from fastapi import APIRouter, Query, HTTPException

router = APIRouter()
logger = logging.getLogger(__name__)

STORY_CACHE_DIR = Path('/tmp/stories')
STORY_CACHE_DIR.mkdir(parents=True, exist_ok=True)


def _load_cached_story(year: int, round_num: int) -> dict | None:
    path = STORY_CACHE_DIR / f"{year}_{round_num}.json"
    if path.exists():
        try:
            return json.loads(path.read_text(encoding='utf-8'))
        except Exception:
            return None
    return None


def _save_story(year: int, round_num: int, story: dict):
    path = STORY_CACHE_DIR / f"{year}_{round_num}.json"
    try:
        path.write_text(json.dumps(story, ensure_ascii=False, indent=2), encoding='utf-8')
    except Exception as e:
        logger.warning(f"Could not cache story {year}_{round_num}: {e}")


def _generate_story(year: int, round_num: int) -> dict:
    """Synchronous: fetch race data + call Gemini to produce narrative."""
    from backend.services import fastf1_service as ff1

    # 1. Get structured race data
    race_data = ff1.get_race_story_data(year, round_num)
    if not race_data:
        return {"error": "No race data available for this round.", "story": None}

    event_name = race_data.get("event_name", f"Round {round_num}")
    winner = race_data.get("winner", "Unknown")
    winner_team = race_data.get("winner_team", "")
    fastest_lap_driver = race_data.get("fastest_lap_driver", "Unknown")
    sc_laps = race_data.get("sc_laps", [])
    dnf_list = race_data.get("dnfs", [])
    top5 = race_data.get("top5", [])
    total_laps = race_data.get("total_laps", 0)
    notable_overtakes = race_data.get("notable_overtakes", "")

    # 2. Build Gemini prompt
    prompt = f"""You are an elite Formula 1 race analyst. Write a dramatic and insightful 3-paragraph post-race narrative for the {year} {event_name}.

Race Facts:
- Winner: {winner} ({winner_team})
- Top 5 finishers: {', '.join(top5)}
- Fastest lap: {fastest_lap_driver}
- Safety car deployed on laps: {sc_laps if sc_laps else 'None'}
- DNFs / retirements: {', '.join(dnf_list) if dnf_list else 'None'}
- Total race laps: {total_laps}
- Notable position changes: {notable_overtakes if notable_overtakes else 'Standard race, no dramatic swings'}

Instructions:
- Paragraph 1: Set the scene — starting grid, any early drama in the first laps.
- Paragraph 2: Mid-race story — strategy battles, safety cars, key overtakes and pit windows.
- Paragraph 3: The conclusion — how the winner secured victory, final standings narrative, championship implications.
- Use vivid, energetic language appropriate for F1 commentary.
- Aim for ~200 words total. Do not use bullet points or headings — pure prose only.
"""

    # 3. Call Gemini via REST
    try:
        import httpx
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not set")
            
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}]
        }
        
        with httpx.Client(timeout=30.0) as client:
            res = client.post(url, json=payload)
            res.raise_for_status()
            
            resp_data = res.json()
            story_text = resp_data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            story_text = story_text.strip()
            
    except Exception as e:
        logger.error(f"Gemini storyteller error: {e}")
        story_text = (
            f"The {year} {event_name} saw {winner} claim victory in a commanding drive. "
            f"The race featured {len(sc_laps)} safety car period(s) and {len(dnf_list)} retirement(s). "
            f"{fastest_lap_driver} set the fastest lap of the race. "
            f"Full AI narrative temporarily unavailable."
        )

    result = {
        "year": year,
        "round": round_num,
        "event_name": event_name,
        "winner": winner,
        "winner_team": winner_team,
        "story": story_text,
        "top5": top5,
        "sc_laps": sc_laps,
        "dnfs": dnf_list,
        "fastest_lap_driver": fastest_lap_driver,
    }
    return result


@router.get('/race')
async def get_race_story(year: int = Query(2025), round: int = Query(1)):
    """
    Returns an AI-generated 3-paragraph race narrative for the given round.
    Caches result to disk so Gemini is never called twice for the same race.
    """
    # Serve from cache if available
    cached = _load_cached_story(year, round)
    if cached:
        cached['cached'] = True
        return cached

    # Generate fresh
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, _generate_story, year, round)

    if result.get('story') and 'error' not in result:
        _save_story(year, round, result)

    return result


@router.get('/latest')
async def get_latest_story(year: int = Query(2025)):
    """Returns the most recently cached story for a season (for Dashboard widget)."""
    stories = []
    for f in STORY_CACHE_DIR.glob(f"{year}_*.json"):
        try:
            data = json.loads(f.read_text(encoding='utf-8'))
            stories.append(data)
        except Exception:
            continue
    if not stories:
        return {"story": None, "event_name": None}
    # Return highest round number cached
    latest = max(stories, key=lambda s: s.get('round', 0))
    latest['cached'] = True
    return latest

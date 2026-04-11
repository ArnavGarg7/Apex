"""
backend/routes/news.py
Fetches latest F1 news via Gemini API with robust JSON extraction.
"""
import os
import re
import json
import asyncio
import logging
from fastapi import APIRouter, HTTPException, Depends
from backend.dependencies import require_auth
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)
router = APIRouter()

def fetch_f1_news_from_gemini() -> dict:
    from backend.config import get_settings
    settings = get_settings()
    api_key = settings.GEMINI_API_KEY

    fallback_articles = [
        {"title": "Hamilton's Ferrari Era Begins: 'I've Never Felt More Motivated'", "source": "APEX Sports", "time": "1h ago", "summary": "Lewis Hamilton has spoken exclusively about his maiden year with Scuderia Ferrari, revealing the cultural shift has reinvigorated his drive for an 8th title. He set his fastest laps yet in the SF-26 during recent simulator sessions."},
        {"title": "McLaren Lead 2026 Constructors' Championship After 3 Rounds", "source": "F1 Official", "time": "3h ago", "summary": "Norris and Piastri continue their dominant run, with the MCL60's ground-effect package proving formidable on street circuits. McLaren's tyre management strategy has been singled out as their key advantage."},
        {"title": "New 2026 Power Unit Regs: Who's Leading the Engine War?", "source": "Technical F1", "time": "5h ago", "summary": "With the 2026 hybrid regulations now live, Honda-powered Aston Martin and the revamped Mercedes unit are emerging as early threats to Ferrari's supposed power advantage. Dyno outputs and deployment strategies are being kept tightly classified."},
        {"title": "Red Bull Confirm Verstappen at Crossroads Over 2027 Contract", "source": "Sky Sports F1", "time": "Yesterday", "summary": "Max Verstappen's future remains uncertain as several top teams circle with attractive offers for the post-2026 era. Red Bull are said to be preparing a record-breaking retention package."},
        {"title": "FIA Introduce AI-Assisted Race Control for 2026 Season", "source": "Motorsport Week", "time": "2d ago", "summary": "The governing body has launched a pilot AI decision-support system for stewards to improve consistency of penalty enforcement. The system flagged 14 incidents in Round 1 alone."},
        {"title": "Ferrari's Leclerc: 'We Can Win the Title This Year'", "source": "La Gazzetta", "time": "3d ago", "summary": "Charles Leclerc is bullish about Ferrari's 2026 championship prospects, pointing to their improved reliability record and the SF-26's superior downforce in the medium-high speed sections."}
    ]

    if not api_key:
        logger.warning("GEMINI_API_KEY missing — using fallback news")
        return {"articles": fallback_articles}

    try:
        from google import genai
        client = genai.Client(api_key=api_key)
    except Exception as e:
        logger.error(f"Gemini client error: {e}")
        return {"articles": fallback_articles}

    from datetime import date
    today = date.today().strftime('%B %d, %Y')
    prompt = (
        f"Today's date is {today}. You are an expert Formula 1 journalist. "
        "Search for and summarize the 15 most important Formula 1 news stories from the past 7 days. "
        "Cover a range of topics including: race results, qualifying, driver news, team announcements, "
        "technical updates, FIA regulations, championship standings, and paddock gossip. "
        "Order them from most recent to oldest. "
        "For each story return a JSON object with these exact keys: "
        "'title' (punchy, specific headline — include driver/team names), "
        "'source' (real publisher name, e.g. 'Sky Sports F1', 'Autosport', 'The Race', 'F1.com', 'Motorsport.com', 'BBC Sport'), "
        "'time' (relative time like '1h ago', '3h ago', 'Yesterday', '2 days ago', '3 days ago', etc.), "
        "'summary' (2 sentences: first states the key fact, second adds context or implication). "
        "Return ONLY a raw JSON array of those 15 objects — no markdown, no code blocks, no preamble, no explanation."
    )

    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
        )
        raw = response.text.strip()

        # Strip markdown code fences if present
        raw = re.sub(r'^```(?:json)?\s*', '', raw)
        raw = re.sub(r'\s*```$', '', raw).strip()

        # Find the JSON array
        match = re.search(r'\[.+\]', raw, re.DOTALL)
        if match:
            raw = match.group(0)

        articles = json.loads(raw)
        if not isinstance(articles, list):
            raise ValueError("Gemini did not return a list")

        return {"articles": articles[:15]}

    except Exception as e:
        logger.warning(f"Gemini processing failure, using fallback: {e}")
        return {"articles": fallback_articles}


@router.get('/latest')
async def get_latest_news(user=Depends(require_auth)):
    """Fetch recent Formula 1 News powered by Gemini AI"""
    try:
        loop = asyncio.get_event_loop()
        data = await loop.run_in_executor(None, fetch_f1_news_from_gemini)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
        {"title": "Lewis Hamilton Prepares for Ferrari Debut", "source": "APEX Sports", "time": "1h ago", "summary": "Seven-time champion Lewis Hamilton is reportedly ahead of schedule in his simulation tests for the Scuderia."},
        {"title": "Red Bull Unveils Radical 'Zero-Sidepod' Evolution", "source": "F1 Insider", "time": "3h ago", "summary": "Adrian Newey's final design for Red Bull is rumored to feature an even more extreme aerodynamic package than 2024."},
        {"title": "Las Vegas Grand Prix Tickets Sell Out in Record Time", "source": "NewsWire", "time": "5h ago", "summary": "The third running of the Vegas GP has already cleared its general admission inventory, signaling massive interest."},
        {"title": "Formula 1 Agrees to New Engine Regulations for 2026", "source": "Technical Blog", "time": "Yesterday", "summary": "Teams have finalized the power unit specifications, focusing on increased electrical power and sustainable fuels."},
        {"title": "Oscar Piastri Signs Multi-Year Extension with McLaren", "source": "RaceHub", "time": "2d ago", "summary": "The Australian star commits his long-term future to Woking after a stellar run of podium finishes."},
        {"title": "F1 Academy to Join Support Grid for 10 Races in 2025", "source": "Series Official", "time": "3d ago", "summary": "The all-female series will see increased visibility with more weekend integration with the main F1 calendar."}
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

    prompt = (
        "Search the web for the top 6 latest Formula 1 news stories from right now. "
        "For each story return a JSON object with these exact keys: "
        "'title' (punchy headline string), "
        "'source' (publisher name string), "
        "'time' (relative time like '2h ago' or 'Yesterday'), "
        "'summary' (2-sentence exciting summary string). "
        "Return ONLY a raw JSON array of those objects — no markdown, no code blocks, no explanation."
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

        return {"articles": articles[:6]}

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

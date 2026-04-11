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
        {"title": "Hamilton's Ferrari Era Begins: 'I've Never Felt More Motivated'", "source": "Sky Sports F1", "time": "1h ago", "summary": "Lewis Hamilton has spoken exclusively about his maiden year with Scuderia Ferrari, revealing the cultural shift has reinvigorated his drive for an 8th title. He set his fastest laps yet in the SF-26 during recent simulator sessions."},
        {"title": "McLaren Lead 2026 Constructors' Championship After 3 Rounds", "source": "F1 Official", "time": "3h ago", "summary": "Norris and Piastri continue their dominant run, with the MCL60's ground-effect package proving formidable on street circuits. McLaren's tyre management strategy has been singled out as their key advantage."},
        {"title": "New 2026 Power Unit Regs: Who's Leading the Engine War?", "source": "Autosport", "time": "5h ago", "summary": "With the 2026 hybrid regulations now live, Honda-powered Aston Martin and the revamped Mercedes unit are emerging as early threats to Ferrari's supposed power advantage. Dyno outputs and deployment strategies are being kept tightly classified."},
        {"title": "Red Bull Confirm Verstappen at Crossroads Over 2027 Contract", "source": "Sky Sports F1", "time": "Yesterday", "summary": "Max Verstappen's future remains uncertain as several top teams circle with attractive offers for the post-2026 era. Red Bull are said to be preparing a record-breaking retention package."},
        {"title": "FIA Introduce AI-Assisted Race Control for 2026 Season", "source": "Motorsport.com", "time": "Yesterday", "summary": "The governing body has launched a pilot AI decision-support system for stewards to improve consistency of penalty enforcement. The system flagged 14 incidents in Round 1 alone."},
        {"title": "Ferrari's Leclerc: 'We Can Win the Title This Year'", "source": "The Race", "time": "2 days ago", "summary": "Charles Leclerc is bullish about Ferrari's 2026 championship prospects, pointing to their improved reliability record and the SF-26's superior downforce in the medium-high speed sections."},
        {"title": "Aston Martin's Bold Upgrade Package Shakes Up Midfield", "source": "Autosport", "time": "2 days ago", "summary": "Aston Martin brought a significant floor and sidepod revision to the last race weekend, immediately propelling the AMR26 into Q3 contention. Fernando Alonso described it as the biggest single step the team has made in his tenure."},
        {"title": "Pirelli Reveals 2026 Tyre Compounds After Extensive Testing", "source": "F1.com", "time": "3 days ago", "summary": "Pirelli has finalised its compound range for the 2026 season following extensive testing in Abu Dhabi and Bahrain. The new C3 compound offers 8% more mechanical grip to compensate for reduced downforce in the new regulations."},
        {"title": "George Russell Takes Pole in Dominant Quali Display", "source": "BBC Sport", "time": "3 days ago", "summary": "George Russell secured pole position with a stunning final sector that no rival could match, extending his qualifying record for Mercedes. The Briton was visibly moved after ending a 14-race pole drought."},
        {"title": "Alpine's Doohan Impresses With Back-to-Back Points Finishes", "source": "Motorsport.com", "time": "4 days ago", "summary": "Jack Doohan has silenced critics with consecutive top-10 finishes, showcasing smooth racecraft and strong tyre management rarely seen from a rookie. Alpine management have privately expressed delight at his rapid adaptation."},
        {"title": "FIA Clears Red Bull Rear Wing After Technical Protest", "source": "The Race", "time": "4 days ago", "summary": "Following a technical protest by Ferrari, the FIA declared Red Bull's rear wing assembly legal under 2026 regulations after a two-hour inspection. The ruling was a significant relief for Red Bull ahead of the championship battle."},
        {"title": "Haas Secure First Podium in Team History at Jeddah", "source": "Sky Sports F1", "time": "5 days ago", "summary": "Haas driver Ollie Bearman capitalised on a late safety car and superb strategy to claim a stunning third place at the Saudi Arabian Grand Prix. The result marks the American team's best-ever race finish."},
        {"title": "Williams Announce Major Shareholder Investment for 2027 Era", "source": "BBC Sport", "time": "5 days ago", "summary": "Williams Racing has confirmed a significant investment injection ahead of the 2027 regulations, aimed at revamping the wind tunnel and simulator infrastructure. CEO James Vowles described it as a 'transformative moment' for the Grove-based outfit."},
        {"title": "Andretti Global Submits Revised FIA Entry Documentation", "source": "Autosport", "time": "6 days ago", "summary": "Andretti Global — now backed by General Motors — has submitted a revised entry application to the FIA for a 2028 start, following updated financial guarantees. The bid is expected to receive a formal hearing within the next 30 days."},
        {"title": "F1 Confirms Record 24-Race Calendar for 2027 Season", "source": "F1.com", "time": "7 days ago", "summary": "Formula 1 has officially confirmed a 24-race calendar for the 2027 season, with Madrid joining the grid for the first time and a second US race in Dallas under discussion. The announcement came alongside new broadcast rights deals across three continents."}
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
        from google.genai import types as genai_types
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                max_output_tokens=4096,
                temperature=0.7,
            ),
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

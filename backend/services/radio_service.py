"""
backend/services/radio_service.py
Fetches Race Control messages via SignalR (live) or OpenF1 (historical)
and uses Gemini to assign a fast "Sentiment / Emotion" tag.
"""
import logging
from backend.services import openf1_service as openf1

logger = logging.getLogger(__name__)


def _get_signalr_race_control() -> list:
    """Return race control messages from the live SignalR cache, or empty list."""
    try:
        from backend.services.signalr_service import cache, build_race_control_response
        if cache.is_populated and cache.get('RaceControlMessages'):
            return build_race_control_response(cache)
    except Exception as e:
        logger.debug(f"SignalR race control unavailable: {e}")
    return []


async def get_analyzed_race_control(session_key: int) -> list:
    """Gets race control messages and batches them to Gemini for emotion tagging.

    Priority: SignalR cache (live, free) → OpenF1 REST (historical, free off-session).
    """
    # ① Try SignalR live data first
    messages = _get_signalr_race_control()

    # ② Fall back to OpenF1 REST (works off-session only)
    if not messages:
        try:
            messages = await openf1.get_race_control(session_key)
        except Exception as e:
            logger.warning(f"OpenF1 race control fallback failed: {e}")
            messages = []

    if not messages:
        return []

    # Sort messages chronologically and take the last 30 so we don't blow up the prompt
    messages = sorted(messages, key=lambda x: x.get('date', '') or x.get('Utc', ''))[-30:]
    
    # We will build a prompt to tag them
    from backend.config import get_settings
    settings = get_settings()
    api_key = settings.GEMINI_API_KEY

    # Default fallback tags
    for msg in messages:
        msg_text = str(msg.get('message', '') or msg.get('Message', '')).upper()
        if 'PENALTY' in msg_text or 'INVESTIGATION' in msg_text:
            msg['emotion'] = 'WARNING'
        elif 'SAFETY CAR' in msg_text or 'RED FLAG' in msg_text or 'YELLOW' in msg_text:
            msg['emotion'] = 'DANGER'
        elif 'CLEAR' in msg_text or 'GREEN' in msg_text:
            msg['emotion'] = 'CLEAR'
        else:
            msg['emotion'] = 'INFO'
            
    if not api_key:
        return list(reversed(messages))

    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        
        # Prepare batch string
        lines = []
        for i, m in enumerate(messages):
            lines.append(f"[{i}] {m.get('message') or m.get('Message', '')}")
            
        prompt = (
            "You are an F1 Race Control Sentiment analyzer. Assign an emotion/category to each message.\n"
            "Categories allowed: DANGER (crashes, safety car, yellow flags), WARNING (penalties, investigations, track limits), CLEAR (green flags, track clear), INFO (admin, drs enabled).\n"
            "Analyze these messages and return exactly a JSON list of objects: [{\"id\": 0, \"emotion\": \"DANGER\"}, ...]\n\n"
            + "\n".join(lines)
        )
        
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
        )
        
        import re, json
        raw = response.text.strip()
        raw = re.sub(r'^```(?:json)?\s*', '', raw)
        raw = re.sub(r'\s*```$', '', raw).strip()
        
        match = re.search(r'\[.+\]', raw, re.DOTALL)
        if match:
            raw = match.group(0)
            
        tag_data = json.loads(raw)
        
        for tag in tag_data:
            idx = tag.get("id")
            if idx is not None and 0 <= idx < len(messages):
                messages[idx]['emotion'] = tag.get("emotion", "INFO")
                
    except Exception as e:
        logger.error(f"Failed to tag emotions with Gemini: {e}")
        
    return list(reversed(messages))

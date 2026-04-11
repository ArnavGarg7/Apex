"""
backend/services/radio_service.py
Fetches Race Control messages via OpenF1 and uses Gemini to assign a fast "Sentiment / Emotion" tag.
"""
import logging
from backend.services import openf1_service as openf1

logger = logging.getLogger(__name__)

async def get_analyzed_race_control(session_key: int) -> list:
    """Gets race control messages and batches them to Gemini for emotion tagging."""
    messages = await openf1.get_race_control(session_key)
    if not messages:
        return []

    # Sort messages chronologically and take the last 30 so we don't blow up the prompt
    messages = sorted(messages, key=lambda x: x.get('date', ''))[-30:]
    
    # We will build a prompt to tag them
    from backend.config import get_settings
    settings = get_settings()
    api_key = settings.GEMINI_API_KEY

    # Default fallback tags
    for msg in messages:
        msg_text = str(msg.get('message', '')).upper()
        if 'PENALTY' in msg_text or 'INVESTIGATION' in msg_text:
            msg['emotion'] = 'WARNING'
        elif 'SAFETY CAR' in msg_text or 'RED FLAG' in msg_text or 'YELLOW' in msg_text:
            msg['emotion'] = 'DANGER'
        elif 'CLEAR' in msg_text or 'GREEN' in msg_text:
            msg['emotion'] = 'CLEAR'
        else:
            msg['emotion'] = 'INFO'
            
    if not api_key:
        return reversed(messages)

    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        
        # Prepare batch string
        lines = []
        for i, m in enumerate(messages):
            lines.append(f"[{i}] {m.get('message')}")
            
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
        
    return reversed(messages)

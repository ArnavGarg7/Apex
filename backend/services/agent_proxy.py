"""
backend/services/agent_proxy.py

Transparent proxy to the local historical agent (f1_local_agent.py).

FastF1 fetches session data from livetiming.formula1.com, which 403-blocks
Cloud Run's datacenter IP. When HISTORICAL_UPSTREAM_URL is configured, the
FastF1-backed routes replay the incoming request (same path + query) to the
agent running on a residential IP and return its JSON verbatim — so the
frontend contract is unchanged.
"""
import logging

import httpx
from fastapi import HTTPException, Request

from backend.config import get_settings

logger = logging.getLogger(__name__)

# Historical/circuit loads can be slow on a cold FastF1 cache.
_TIMEOUT = 120.0


def agent_enabled() -> bool:
    """True when an upstream historical agent URL is configured."""
    return bool((get_settings().HISTORICAL_UPSTREAM_URL or '').strip())


async def proxy_request(request: Request):
    """Replay the current GET request to the historical agent and return its JSON."""
    settings = get_settings()
    base = settings.HISTORICAL_UPSTREAM_URL.strip().rstrip('/')
    url = f"{base}{request.url.path}"
    headers = {'X-Agent-Secret': settings.LIVE_INGEST_SECRET}

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.get(url, params=dict(request.query_params), headers=headers)
    except Exception as e:
        logger.warning(f"Historical agent unreachable ({url}): {e}")
        raise HTTPException(
            status_code=503,
            detail='Historical data agent is offline. Start f1_local_agent.py locally.',
        )

    if resp.status_code >= 400:
        logger.warning(f"Historical agent error {resp.status_code} for {url}: {resp.text[:200]}")
        raise HTTPException(status_code=502, detail=f'Historical agent error {resp.status_code}')

    return resp.json()

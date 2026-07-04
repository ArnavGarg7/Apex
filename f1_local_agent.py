"""
f1_local_agent.py — APEX Local Historical Agent
================================================

FastF1 fetches session data from livetiming.formula1.com, which 403-blocks
Cloud Run's datacenter IP. This agent runs FastF1 on YOUR machine (residential
IP, not blocked) and exposes the exact same historical/circuit endpoints the
cloud backend serves. The cloud backend proxies those routes here (set
HISTORICAL_UPSTREAM_URL on the backend to this agent's public tunnel URL).

Result: Compare (dropdowns + telemetry) and Pre-Race FP2 degradation work with
real data, because the fetch happens from your IP.

── Run it ────────────────────────────────────────────────────────────────────
From the repo root (so the `backend` package resolves):

    # 1. deps (once)
    pip install fastf1 fastapi uvicorn

    # 2. same secret you set on the backend (LIVE_INGEST_SECRET)
    #    PowerShell:
    $env:LIVE_INGEST_SECRET = "<the-same-secret-as-the-backend>"
    python f1_local_agent.py            # serves on http://localhost:8100

── Expose it (so Cloud Run can reach it) ──────────────────────────────────────
    # In another terminal, start a free HTTPS tunnel to port 8100:
    cloudflared tunnel --url http://localhost:8100
    # copy the https://<random>.trycloudflare.com URL it prints, then set on the
    # backend:  HISTORICAL_UPSTREAM_URL = https://<random>.trycloudflare.com
    # (via deploy_cloud.ps1 / gcloud run services update) and redeploy.

Leave the agent + tunnel running whenever you want historical data to work.
"""
import asyncio
import logging
import os

# Point FastF1 at a persistent local cache BEFORE importing the service
# (fastf1_service enables the cache at import time).
os.environ.setdefault('FASTF1_CACHE_DIR', os.path.join(os.path.dirname(__file__), 'data', 'ff1_cache'))

import uvicorn
from fastapi import Depends, FastAPI, Header, HTTPException, Query

from backend.services import fastf1_service as ff1

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(name)s: %(message)s')
logger = logging.getLogger('f1-agent')

AGENT_SECRET = os.environ.get('LIVE_INGEST_SECRET', '')
AGENT_PORT = int(os.environ.get('AGENT_PORT', '8100'))

app = FastAPI(title='APEX Local Historical Agent')


async def require_secret(x_agent_secret: str = Header(default='')):
    """Match the shared secret the cloud backend sends (header X-Agent-Secret)."""
    if not AGENT_SECRET:
        raise HTTPException(status_code=503, detail='Agent secret not configured')
    if x_agent_secret != AGENT_SECRET:
        raise HTTPException(status_code=403, detail='Invalid agent secret')


async def _run(fn, *args):
    """Run a synchronous FastF1 call in a thread so the event loop stays free."""
    return await asyncio.get_event_loop().run_in_executor(None, fn, *args)


@app.get('/api/health')
async def health():
    return {'status': 'ok', 'service': 'APEX Local Historical Agent', 'cache': os.environ['FASTF1_CACHE_DIR']}


# ── Historical (mirror of backend/routes/historical.py FastF1 endpoints) ──────

@app.get('/api/historical/results', dependencies=[Depends(require_secret)])
async def results(year: int, round: int):
    return await _run(ff1.get_session_results, year, round)


@app.get('/api/historical/laps', dependencies=[Depends(require_secret)])
async def laps(year: int, round: int, driver: str = Query(default=None)):
    return await _run(ff1.get_race_laps, year, round, driver)


@app.get('/api/historical/circuit-history/{circuit_id}', dependencies=[Depends(require_secret)])
async def circuit_history(circuit_id: str):
    return await _run(ff1.get_circuit_history, circuit_id)


@app.get('/api/historical/telemetry-compare', dependencies=[Depends(require_secret)])
async def telemetry_compare(year: int, round: int, driver1: str, driver2: str):
    return await _run(ff1.get_telemetry_comparison, year, round, driver1, driver2)


@app.get('/api/historical/race-pace', dependencies=[Depends(require_secret)])
async def race_pace(year: int, round: int, driver1: str, driver2: str):
    return await _run(ff1.get_race_pace_comparison, year, round, driver1, driver2)


@app.get('/api/historical/tyre-deg', dependencies=[Depends(require_secret)])
async def tyre_deg(year: int, round: int):
    return await _run(ff1.get_fp2_degradation, year, round)


# ── Circuit (mirror of backend/routes/circuit.py FastF1 endpoints) ────────────

@app.get('/api/circuit/{circuit_id}/history', dependencies=[Depends(require_secret)])
async def circuit_hist(circuit_id: str):
    return await _run(ff1.get_circuit_history, circuit_id)


@app.get('/api/circuit/{circuit_id}/topology', dependencies=[Depends(require_secret)])
async def circuit_topology(circuit_id: str):
    return await _run(ff1.get_circuit_topology_by_id, circuit_id)


@app.get('/api/circuit/{circuit_id}/heatmap', dependencies=[Depends(require_secret)])
async def circuit_heatmap(circuit_id: str, year: int = 2024):
    return await _run(ff1.get_circuit_heatmap, circuit_id, year)


if __name__ == '__main__':
    if not AGENT_SECRET:
        logger.error('LIVE_INGEST_SECRET not set — refusing to start. '
                     'Set it to the same value as the backend.')
    else:
        logger.info(f'APEX historical agent on http://localhost:{AGENT_PORT} '
                    f'(cache: {os.environ["FASTF1_CACHE_DIR"]})')
        uvicorn.run(app, host='0.0.0.0', port=AGENT_PORT, log_level='info')

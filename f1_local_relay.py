"""
f1_local_relay.py — APEX Local Collector Relay
================================================

Cloud Run's datacenter IP is 403-blocked by F1's live-timing stream, so the
backend cannot connect to it directly. This script runs on YOUR local machine
(an unblocked residential IP), connects to the official F1 SignalR stream, and
forwards every raw frame to the APEX backend's ingest webhook.

The backend then caches + broadcasts exactly as if it had streamed the data
itself, so the frontend SSE / live board are completely unchanged.

Run during a race weekend:

    # 1. Point it at your deployed backend and set the shared secret
    #    (must match LIVE_INGEST_SECRET on the backend)
    export APEX_BACKEND_URL="https://apex-backend-uqtw7bvyla-uc.a.run.app"
    export LIVE_INGEST_SECRET="<the-same-secret-as-the-backend>"

    # 2. Install deps (once) and run
    pip install signalrcore requests
    python f1_local_relay.py

Windows PowerShell:
    $env:APEX_BACKEND_URL="https://apex-backend-uqtw7bvyla-uc.a.run.app"
    $env:LIVE_INGEST_SECRET="<secret>"
    python f1_local_relay.py

Leave it running for the duration of the session. Ctrl-C to stop.
"""
import logging
import os
import queue
import threading
import time

import requests

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s: %(message)s',
    datefmt='%H:%M:%S',
)
logger = logging.getLogger('f1-relay')

# ─── Config ───────────────────────────────────────────────────────────────────

BACKEND_URL = os.environ.get('APEX_BACKEND_URL', 'http://localhost:8001').rstrip('/')
INGEST_URL = f'{BACKEND_URL}/api/live/ingest'
INGEST_SECRET = os.environ.get('LIVE_INGEST_SECRET', '')

WS_URL = 'wss://livetiming.formula1.com/signalrcore'
NEGOTIATE_URL = 'https://livetiming.formula1.com/signalrcore/negotiate'

TOPICS = [
    'Heartbeat', 'CarData.z', 'Position.z', 'ExtrapolatedClock',
    'TopThree', 'TimingStats', 'TimingAppData', 'WeatherData',
    'TrackStatus', 'DriverList', 'RaceControlMessages', 'SessionInfo',
    'SessionData', 'LapCount', 'TimingData', 'SessionStatus',
    'TeamRadio', 'RcmSeries',
]

BROWSER_UA = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
              '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')


# ─── Async POST worker (keeps the WS callback non-blocking) ───────────────────

_post_q: "queue.Queue" = queue.Queue(maxsize=2000)


def _post_worker():
    session = requests.Session()
    session.headers.update({
        'Content-Type': 'application/json',
        'X-Ingest-Secret': INGEST_SECRET,
    })
    while True:
        payload = _post_q.get()
        if payload is None:
            break
        try:
            # (connect, read) — generous read timeout so the FIRST post can survive
            # a scale-to-zero cold start of the backend (~15s) instead of dropping it.
            r = session.post(INGEST_URL, json=payload, timeout=(10, 45))
            if r.status_code == 403:
                logger.error('Backend rejected ingest (403) — check LIVE_INGEST_SECRET matches.')
            elif r.status_code == 503:
                logger.error('Backend ingest not configured (503) — set LIVE_INGEST_SECRET on the backend.')
            elif r.status_code >= 400:
                logger.warning(f'Ingest HTTP {r.status_code}: {r.text[:120]}')
        except Exception as e:
            logger.warning(f'Ingest POST failed: {e}')
        finally:
            _post_q.task_done()


def _enqueue(payload: dict):
    try:
        _post_q.put_nowait(payload)
    except queue.Full:
        logger.warning('POST queue full — dropping a frame (backend too slow?)')


# ─── SignalR connection ───────────────────────────────────────────────────────

def _negotiate() -> dict:
    """Pre-flight to obtain the AWSALBCORS load-balancer cookie."""
    headers = {
        'User-Agent': BROWSER_UA,
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
    }
    try:
        r = requests.post(NEGOTIATE_URL, headers=headers, timeout=10)
        if 'AWSALBCORS' in r.cookies:
            headers['Cookie'] = f"AWSALBCORS={r.cookies['AWSALBCORS']}"
    except Exception as e:
        logger.warning(f'Negotiate pre-flight failed (may still work): {e}')
    return headers


def _run_once():
    from signalrcore.hub_connection_builder import HubConnectionBuilder

    headers = _negotiate()
    connected = threading.Event()

    connection = (
        HubConnectionBuilder()
        .with_url(WS_URL, options={
            'verify_ssl': True,
            'access_token_factory': lambda: '',   # free stream — no token
            'headers': headers,
        })
        .configure_logging(logging.WARNING)
        .build()
    )

    def on_open():
        connected.set()
        logger.info('Connected to F1 live timing stream.')

    def on_close():
        logger.info('F1 stream connection closed.')

    def on_feed(msg):
        # Forward the raw feed message untouched; the backend parses/decompresses.
        _enqueue({'type': 'feed', 'args': msg})

    def on_subscribe(msg):
        result = getattr(msg, 'result', None)
        if isinstance(result, dict):
            _enqueue({'type': 'snapshot', 'result': result})
            logger.info(f'Forwarded initial snapshot: {list(result.keys())}')

    connection.on_open(on_open)
    connection.on_close(on_close)
    connection.on('feed', on_feed)
    connection.start()

    # Wait for handshake
    if not connected.wait(timeout=30):
        raise ConnectionError('Handshake timed out after 30s')

    connection.send('Subscribe', [TOPICS], on_invocation=on_subscribe)
    logger.info(f'Subscribed to {len(TOPICS)} topics — relaying to {INGEST_URL}')

    # Block forever; signalrcore runs its own WS thread. Ctrl-C to exit.
    try:
        while True:
            time.sleep(1)
    finally:
        try:
            connection.stop()
        except Exception:
            pass


def main():
    if not INGEST_SECRET:
        logger.error('LIVE_INGEST_SECRET is not set — refusing to start. '
                     'Set it to the same value as the backend.')
        return

    logger.info(f'APEX relay → {INGEST_URL}')

    # Proactively wake the backend (it scales to zero when idle, ~15s cold start)
    # so the first frames aren't lost to a cold start.
    try:
        logger.info('Warming up backend (may take ~15s on a cold start)...')
        requests.get(f'{BACKEND_URL}/api/health', timeout=60)
        logger.info('Backend is awake.')
    except Exception as e:
        logger.warning(f'Warm-up ping failed (continuing anyway): {e}')

    threading.Thread(target=_post_worker, daemon=True, name='post-worker').start()

    retry = 5
    while True:
        try:
            _run_once()
            retry = 5
        except KeyboardInterrupt:
            logger.info('Stopped by user.')
            break
        except Exception as e:
            logger.error(f'Connection error: {e}')
            logger.info(f'Reconnecting in {retry}s...')
            try:
                time.sleep(retry)
            except KeyboardInterrupt:
                break
            retry = min(retry * 2, 120)


if __name__ == '__main__':
    main()

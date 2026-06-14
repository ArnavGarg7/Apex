"""
backend/services/signalr_service.py

F1 Live Timing via the official F1 SignalR WebSocket stream.

Bypasses OpenF1's paid-during-race restriction by connecting directly
to the same source the official F1 app uses — completely free.

Stream URL: wss://livetiming.formula1.com/signalrcore
Topics:     TimingData, DriverList, SessionStatus, WeatherData, etc.
"""
import asyncio
import base64
import json
import logging
import threading
import time
import zlib
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional

import requests

logger = logging.getLogger(__name__)


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _deep_merge(base: dict, update: Any) -> dict:
    """Recursively merge *update* into *base* in-place. Returns base."""
    if not isinstance(update, dict) or not isinstance(base, dict):
        return update
    for key, value in update.items():
        if key in base and isinstance(base[key], dict) and isinstance(value, dict):
            _deep_merge(base[key], value)
        else:
            base[key] = value
    return base


# ─── In-Memory Cache ─────────────────────────────────────────────────────────

class LiveTimingCache:
    """Thread-safe in-memory store for live F1 timing state.

    Populated by F1SignalRService from the official SignalR stream.
    Read by REST endpoints and the SSE broadcast loop.
    """

    def __init__(self):
        self._lock = threading.Lock()
        self._state: Dict[str, Any] = {}
        self._is_live: bool = False
        self._last_update: Optional[float] = None
        self._callbacks: List[Callable] = []
        # asyncio loop reference — set when the ASGI app starts
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        # Set of asyncio.Queue objects for SSE clients
        self._sse_queues: set = set()
        self._lap_history: Dict[str, list] = {}  # driver_code -> list of {lap, position}

    # ── Write ──────────────────────────────────────────────────────────────

    def set_event_loop(self, loop: asyncio.AbstractEventLoop):
        self._loop = loop

    def update(self, category: str, data: Any):
        """Deep-merge a SignalR message into the in-memory state."""
        with self._lock:
            if category not in self._state:
                self._state[category] = {}

            if isinstance(data, dict):
                _deep_merge(self._state[category], data)
            else:
                self._state[category] = data

            self._last_update = time.time()

            # Drive is_live from SessionStatus
            if category == 'SessionStatus' and isinstance(data, dict):
                status = data.get('Status', '')
                if status in ('Started',):
                    self._is_live = True
                elif status in ('Finished', 'Finalised', 'Ends'):
                    self._is_live = False

            # Track lap history for the Lap Chart
            if category == 'TimingData' and isinstance(data, dict):
                lines = data.get('Lines', {})
                if isinstance(lines, dict):
                    driver_list = self._state.get('DriverList', {})
                    for num_str, line in lines.items():
                        if not isinstance(line, dict): continue
                        pos = line.get('Position') or line.get('Line')
                        laps = line.get('NumberOfLaps')
                        if pos is not None and laps is not None:
                            try:
                                lap_int = int(laps)
                                pos_int = int(pos)
                            except (ValueError, TypeError):
                                continue
                            
                            drv = driver_list.get(num_str, {})
                            code = drv.get('Tla') if isinstance(drv, dict) else None
                            if code:
                                if code not in self._lap_history:
                                    self._lap_history[code] = []
                                hist = self._lap_history[code]
                                if not hist or hist[-1]['lap'] < lap_int:
                                    hist.append({'lap': lap_int, 'position': pos_int})
                                elif hist[-1]['lap'] == lap_int:
                                    hist[-1]['position'] = pos_int

        # Broadcast to SSE clients (from any thread)
        self._broadcast_sse(category, data)

    def _broadcast_sse(self, category: str, data: Any):
        """Push an update to all connected SSE clients."""
        if not self._loop or not self._sse_queues:
            return
        msg = {'category': category, 'data': data if isinstance(data, (dict, list)) else str(data)}
        for q in list(self._sse_queues):
            try:
                asyncio.run_coroutine_threadsafe(q.put(msg), self._loop)
            except Exception:
                pass

    def register_sse_queue(self, q: asyncio.Queue):
        self._sse_queues.add(q)

    def unregister_sse_queue(self, q: asyncio.Queue):
        self._sse_queues.discard(q)

    # ── Read ───────────────────────────────────────────────────────────────

    def get(self, category: str) -> Any:
        with self._lock:
            return deepcopy(self._state.get(category, {}))

    @property
    def is_live(self) -> bool:
        with self._lock:
            return self._is_live

    @is_live.setter
    def is_live(self, value: bool):
        with self._lock:
            self._is_live = value

    @property
    def is_populated(self) -> bool:
        """True once any data has been received from the stream."""
        with self._lock:
            return bool(self._state)

    @property
    def last_update(self) -> Optional[float]:
        with self._lock:
            return self._last_update

    def clear(self):
        with self._lock:
            self._state.clear()
            self._is_live = False
            self._last_update = None


# ─── SignalR Service ──────────────────────────────────────────────────────────

class F1SignalRService:
    """
    Connects to the official F1 live timing SignalR stream and populates
    a LiveTimingCache.  Runs in a background daemon thread.

    No API key required — uses no_auth (access_token_factory=None).
    This is the same unauthenticated stream used by community timing apps
    (e.g. multiviewer-for-f1).  OpenF1 is merely a middleman that started
    paywalling their REST wrapper; the underlying stream remains free.
    """

    _WS_URL        = 'wss://livetiming.formula1.com/signalrcore'
    _NEGOTIATE_URL = 'https://livetiming.formula1.com/signalrcore/negotiate'

    _TOPICS = [
        'Heartbeat', 'CarData.z', 'Position.z', 'ExtrapolatedClock',
        'TopThree', 'TimingStats', 'TimingAppData', 'WeatherData',
        'TrackStatus', 'DriverList', 'RaceControlMessages', 'SessionInfo',
        'SessionData', 'LapCount', 'TimingData', 'SessionStatus',
        'TeamRadio', 'RcmSeries',
    ]

    def __init__(self, cache: LiveTimingCache):
        self.cache = cache
        self._thread: Optional[threading.Thread] = None
        self._connection = None
        self._is_connected = False
        self._should_stop = threading.Event()
        self._t_last_message: Optional[float] = None

    # ── Lifecycle ─────────────────────────────────────────────────────────

    def start(self):
        if self._thread and self._thread.is_alive():
            logger.debug('SignalR service already running')
            return
        self._should_stop.clear()
        self._thread = threading.Thread(
            target=self._run_loop, daemon=True, name='F1-SignalR'
        )
        self._thread.start()
        logger.info('F1 SignalR service started')

    def stop(self):
        self._should_stop.set()
        if self._connection:
            try:
                self._connection.stop()
            except Exception:
                pass
        logger.info('F1 SignalR service stopped')

    # ── Connection Loop ───────────────────────────────────────────────────

    def _run_loop(self):
        retry = 5
        while not self._should_stop.is_set():
            try:
                self._connect_and_run()
                retry = 5
            except Exception as e:
                logger.error(f'SignalR connection error: {e}')
            if not self._should_stop.is_set():
                logger.info(f'SignalR reconnecting in {retry}s...')
                self._should_stop.wait(retry)
                retry = min(retry * 2, 120)

    def _connect_and_run(self):
        from signalrcore.hub_connection_builder import HubConnectionBuilder

        headers = self._negotiate()
        self._is_connected = False

        self._connection = (
            HubConnectionBuilder()
            .with_url(self._WS_URL, options={
                'verify_ssl': True,
                'access_token_factory': lambda: '',   # Free stream — no auth token (must be callable)
                'headers': headers,
            })
            .configure_logging(logging.WARNING)
            .build()
        )

        self._connection.on_open(self._on_open)
        self._connection.on_close(self._on_close)
        self._connection.on('feed', self._on_feed)
        self._connection.start()

        # Wait up to 30 s for the connection handshake
        deadline = time.time() + 30
        while not self._is_connected:
            if time.time() > deadline or self._should_stop.is_set():
                raise ConnectionError('Connection handshake timed out after 30 s')
            time.sleep(0.1)

        # Subscribe to all timing topics — response contains the full initial state
        self._connection.send(
            'Subscribe', [self._TOPICS],
            on_invocation=self._on_subscribe_response,
        )
        self._t_last_message = time.time()
        logger.info('✅ Connected to F1 live timing stream and subscribed to topics')

        self._supervise()

    def _negotiate(self) -> dict:
        """Pre-flight OPTIONS to obtain the AWSALBCORS load-balancer cookie."""
        headers: dict = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive'
        }
        try:
            r = requests.post(self._NEGOTIATE_URL, headers=headers, timeout=10)
            if 'AWSALBCORS' in r.cookies:
                headers['Cookie'] = f"AWSALBCORS={r.cookies['AWSALBCORS']}"
        except Exception as e:
            logger.warning(f'Negotiate pre-flight failed (may still work): {e}')
        return headers

    def _supervise(self):
        """Block this thread until timeout or stop signal."""
        no_data_limit = 120  # seconds — if no data arrives, reconnect
        while not self._should_stop.is_set() and self._is_connected:
            time.sleep(1)
            if (self._t_last_message
                    and time.time() - self._t_last_message > no_data_limit):
                logger.warning(f'No data for {no_data_limit} s — reconnecting')
                try:
                    self._connection.stop()
                except Exception:
                    pass
                break

    # ── Callbacks ─────────────────────────────────────────────────────────

    def _on_open(self):
        self._is_connected = True

    def _on_close(self):
        self._is_connected = False
        logger.info('F1 timing stream connection closed')

    def _on_subscribe_response(self, msg):
        """Initial full-state dump returned as response to Subscribe."""
        self._t_last_message = time.time()
        try:
            if hasattr(msg, 'result') and isinstance(msg.result, dict):
                for category, data in msg.result.items():
                    self._process_entry(category, data, already_parsed=True)
                logger.info(f'Initial state dump received: {list(msg.result.keys())}')
        except Exception as e:
            logger.debug(f'Subscribe response parse error: {e}')

    def _on_feed(self, msg):
        """Real-time incremental updates pushed by the server."""
        self._t_last_message = time.time()
        try:
            self._dispatch(msg)
        except Exception as e:
            logger.debug(f'Feed dispatch error: {e}')

    # ── Message Parsing ───────────────────────────────────────────────────

    def _dispatch(self, msg):
        """Route a raw SignalR message to the cache."""
        if isinstance(msg, list):
            if len(msg) >= 2 and isinstance(msg[0], str):
                # Single update: [category, data_str_or_dict, timestamp]
                self._process_entry(msg[0], msg[1])
            else:
                # Batch of updates
                for item in msg:
                    if isinstance(item, (list, tuple)) and len(item) >= 2:
                        self._process_entry(item[0], item[1])
        elif hasattr(msg, 'result') and isinstance(msg.result, dict):
            for category, data in msg.result.items():
                self._process_entry(category, data, already_parsed=True)

    def _process_entry(self, category: str, raw: Any, already_parsed: bool = False):
        """Parse one category/data pair and push it into the cache."""
        data = raw if already_parsed else (
            json.loads(raw) if isinstance(raw, str) else raw
        )

        # Decompress zlib/base64 topics (CarData.z, Position.z)
        if category.endswith('.z') and isinstance(data, str):
            try:
                decompressed = zlib.decompress(
                    base64.b64decode(data), -zlib.MAX_WBITS
                )
                data = json.loads(decompressed)
                category = category[:-2]  # 'CarData.z' → 'CarData'
            except Exception:
                return  # Skip corrupt compressed frames

        self.cache.update(category, data)


# ─── Response Builders ────────────────────────────────────────────────────────

def build_session_response(c: LiveTimingCache) -> dict:
    """Convert SignalR cache state → /api/live/session response dict."""
    info       = c.get('SessionInfo')   or {}
    status_raw = c.get('SessionStatus') or {}
    lap_count  = c.get('LapCount')      or {}

    meeting = info.get('Meeting', {}) if isinstance(info, dict) else {}
    country = meeting.get('Country', {})
    circuit = meeting.get('Circuit', {})

    # Extract session_key if available in SessionInfo.Key
    session_key = None
    if isinstance(info, dict):
        session_key = info.get('Key') or None

    return {
        'is_live':            c.is_live,
        'data_restricted':    False,   # SignalR stream is active — no restriction
        'status':             status_raw.get('Status', 'Started') if isinstance(status_raw, dict) else 'Started',
        'session_name':       info.get('Name', 'Race') if isinstance(info, dict) else 'Race',
        'meeting_name':       meeting.get('Name', '') if isinstance(meeting, dict) else '',
        'country_name':       (country.get('Name', '') if isinstance(country, dict) else country) or '',
        'circuit_short_name': (circuit.get('ShortName', '') if isinstance(circuit, dict) else circuit) or '',
        'session_key':        session_key,
        'current_lap':        lap_count.get('CurrentLap') if isinstance(lap_count, dict) else None,
        'total_laps':         lap_count.get('TotalLaps')  if isinstance(lap_count, dict) else None,
        'data_delay_seconds': 0,   # True real-time!
        'source':             'signalr',
    }


def build_timing_response(c: LiveTimingCache) -> list:
    """Convert SignalR cache state → /api/live/timing response list."""
    timing_data = c.get('TimingData')    or {}
    timing_app  = c.get('TimingAppData') or {}
    driver_list = c.get('DriverList')    or {}

    if not driver_list:
        return []

    lines     = timing_data.get('Lines', {}) if isinstance(timing_data, dict) else {}
    app_lines = timing_app.get('Lines', {})  if isinstance(timing_app, dict)  else {}

    result = []
    for num_str, drv in driver_list.items():
        if not isinstance(drv, dict):
            continue

        dn   = int(num_str) if num_str.isdigit() else 0
        tl   = lines.get(num_str, {})     or {}   # timing line for this driver
        al   = app_lines.get(num_str, {}) or {}   # app-data line for this driver

        # Position
        pos = tl.get('Position', tl.get('Line', 99))
        try:
            pos = int(pos)
        except (ValueError, TypeError):
            pos = 99

        # Gaps
        gap          = tl.get('GapToLeader', '')
        interval_obj = tl.get('IntervalToPositionAhead', {})
        interval     = interval_obj.get('Value', '') if isinstance(interval_obj, dict) else str(interval_obj)

        # Last lap time
        lap_obj  = tl.get('LastLapTime', {})
        last_lap = lap_obj.get('Value', '') if isinstance(lap_obj, dict) else str(lap_obj)

        # Tyre info from latest stint in TimingAppData
        compound  = 'UNKNOWN'
        tyre_age  = 0
        pit_stops = 0
        stints_raw = al.get('Stints', {})
        if stints_raw:
            stint_list = list(stints_raw.values()) if isinstance(stints_raw, dict) else stints_raw
            if stint_list:
                latest_stint = stint_list[-1]
                if isinstance(latest_stint, dict):
                    compound  = latest_stint.get('Compound', 'UNKNOWN')
                    tyre_age  = latest_stint.get('TotalLaps', 0)
                    pit_stops = max(0, len(stint_list) - 1)

        # Sectors
        sectors = tl.get('Sectors', {})
        s1 = s2 = s3 = ''
        if isinstance(sectors, dict):
            s1_obj = sectors.get('0', {})
            s2_obj = sectors.get('1', {})
            s3_obj = sectors.get('2', {})
            s1 = s1_obj.get('Value', '') if isinstance(s1_obj, dict) else str(s1_obj)
            s2 = s2_obj.get('Value', '') if isinstance(s2_obj, dict) else str(s2_obj)
            s3 = s3_obj.get('Value', '') if isinstance(s3_obj, dict) else str(s3_obj)
        elif isinstance(sectors, list):
            s1 = sectors[0].get('Value', '') if len(sectors) > 0 and isinstance(sectors[0], dict) else ''
            s2 = sectors[1].get('Value', '') if len(sectors) > 1 and isinstance(sectors[1], dict) else ''
            s3 = sectors[2].get('Value', '') if len(sectors) > 2 and isinstance(sectors[2], dict) else ''

        result.append({
            'driver_number':      dn,
            'driver_code':        drv.get('Tla', '???'),
            'driver_name':        drv.get('FullName', ''),
            'team_name':          drv.get('TeamName', ''),
            'team_colour':        drv.get('TeamColour', ''),
            'position':           pos,
            'gap_to_leader':      str(gap),
            'interval':           str(interval),
            'last_lap_time':      str(last_lap),
            's1_time':            str(s1),
            's2_time':            str(s2),
            's3_time':            str(s3),
            'compound':           compound,
            'tyre_age':           tyre_age,
            'pit_stops':          pit_stops,
            'drs_open':           False,
            'data_delay_seconds': 0,
        })

    result.sort(key=lambda x: x.get('position') or 99)
    return result


def build_weather_response(c: LiveTimingCache) -> dict:
    """Convert SignalR WeatherData → /api/live/weather response."""
    wd = c.get('WeatherData') or {}
    if not isinstance(wd, dict):
        return {}
    return {
        'air_temperature':   _safe_float(wd.get('AirTemp')),
        'track_temperature': _safe_float(wd.get('TrackTemp')),
        'humidity':          _safe_float(wd.get('Humidity')),
        'pressure':          _safe_float(wd.get('Pressure')),
        'wind_speed':        _safe_float(wd.get('WindSpeed')),
        'wind_direction':    _safe_float(wd.get('WindDirection')),
        'rainfall':          wd.get('Rainfall', '0') not in ('0', '', False, None),
        'data_delay_seconds': 0,
        'source':            'signalr',
    }


def build_race_control_response(c: LiveTimingCache) -> list:
    """Convert SignalR RaceControlMessages → list."""
    raw = c.get('RaceControlMessages') or {}
    if isinstance(raw, dict):
        messages = raw.get('Messages', []) or []
    elif isinstance(raw, list):
        messages = raw
    else:
        return []
    normalized = []
    for m in messages:
        if not isinstance(m, dict):
            continue
        normalized.append({
            'data_delay_seconds': 0,
            'date': m.get('Utc') or m.get('date'),
            'message': m.get('Message') or m.get('message'),
            'lap_number': m.get('Lap') or m.get('lap_number'),
            **m
        })
    return normalized


def _safe_float(v) -> Optional[float]:
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


# ─── Module-level Singletons ─────────────────────────────────────────────────

cache   = LiveTimingCache()
service = F1SignalRService(cache)

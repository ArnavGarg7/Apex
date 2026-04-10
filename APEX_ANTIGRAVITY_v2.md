# Antigravity Build Prompt — APEX F1 Intelligence Dashboard (v2 — with Motion & 3D)

## What You Are Building

**Apex** is a premium F1 intelligence dashboard. Live timing, ML tyre strategy predictions, driver head-to-head telemetry, championship standings, circuit explorer, weather, and race calendar — all in one skeuomorphic, cinematic product.

Design language: **skeuomorphic** — carbon fibre panels, physical gauges, pit wall aesthetic.
Motion language: **cinematic on entry, invisible during operation** — Three.js 3D on hero screens, GSAP for dramatic sequences, Framer Motion for data animations, Canvas particles for atmosphere. Once a user is reading live data, everything is still and readable.

Read every section completely before writing any code.

---

## Animation Architecture — Read This First

### Three Tiers of Motion

**Tier 1 — Hero/Cinematic (GSAP + Three.js)**
- Splash screen, lights-out sequence, circuit flyover, page-in reveals
- Full GPU-accelerated only. Never on CPU. Never on LiveTiming page.
- Run once per session where applicable — store flag in sessionStorage

**Tier 2 — Purposeful Data Motion (Framer Motion + D3 + GSAP)**
- Row reorders, chart draw-ins, gauge needle sweeps, bar staggers, number rollers
- Max 600ms. Must not interfere with data readability.

**Tier 3 — Atmospheric (Canvas API)**
- 15–20 particle speed lines at 3% opacity during live session only
- GPU-composited only (transform/opacity only — no layout)

### Hard Rules
- NEVER animate TimingTable cell values — data must be instantly readable
- NEVER run Three.js on LiveTiming page
- ALL animations must respect `prefers-reduced-motion` — disable Tier 1+3, reduce Tier 2 to instant
- Use `detect-gpu` to check GPU tier on load — disable Tier 1 on low-end devices
- GSAP lights-out: check `sessionStorage.getItem('lightsOutShown')` — skip if already played

---

## Package Dependencies

### requirements.txt (Python)
```
fastapi
uvicorn[standard]
fastf1
pandas
numpy
xgboost
scikit-learn
shap
httpx
python-dotenv
pydantic
firebase-admin
```

### package.json (Frontend)
```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "react-router-dom": "^6",
    "zustand": "^4",
    "d3": "^7",
    "firebase": "^10",
    "tailwindcss": "^3",
    "three": "^0.158.0",
    "@react-three/fiber": "^8",
    "@react-three/drei": "^9",
    "gsap": "^3.12",
    "framer-motion": "^10",
    "detect-gpu": "^5"
  },
  "devDependencies": {
    "vite": "^5",
    "@vitejs/plugin-react": "^4"
  }
}
```

---

## Environment Variables (.env.example)

```
OPENF1_BASE_URL=https://api.openf1.org/v1
OPENWEATHER_API_KEY=your_key_here
FASTF1_CACHE_DIR=./data/cache
MODEL_DIR=./ml/models
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_API_BASE_URL=http://localhost:8000
```

---

## File Structure (Scaffold All Files)

```
apex/
├── ml/
│   ├── features.py
│   ├── train.py
│   ├── evaluate.py
│   ├── predict.py
│   ├── shap_explain.py
│   └── models/
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── schemas.py
│   ├── routes/
│   │   ├── live.py
│   │   ├── historical.py
│   │   ├── strategy.py
│   │   ├── standings.py
│   │   ├── calendar.py
│   │   ├── circuit.py
│   │   ├── weather.py
│   │   └── simulate.py
│   └── services/
│       ├── openf1_service.py
│       ├── fastf1_service.py
│       ├── model_service.py
│       ├── weather_service.py
│       └── firebase_service.py
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Splash.jsx
│       │   ├── Dashboard.jsx
│       │   ├── LiveTiming.jsx
│       │   ├── Strategy.jsx
│       │   ├── HeadToHead.jsx
│       │   ├── Standings.jsx
│       │   ├── Calendar.jsx
│       │   ├── Circuit.jsx
│       │   └── Weather.jsx
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Navbar.jsx
│       │   │   ├── Sidebar.jsx
│       │   │   └── PageShell.jsx
│       │   ├── three/
│       │   │   ├── F1CarScene.jsx
│       │   │   ├── CircuitScene.jsx
│       │   │   └── TyreScene.jsx
│       │   ├── animations/
│       │   │   ├── LightsOutSequence.jsx
│       │   │   ├── LogotypeReveal.jsx
│       │   │   ├── PageTransition.jsx
│       │   │   └── ParticleCanvas.jsx
│       │   ├── live/
│       │   │   ├── TimingTable.jsx
│       │   │   ├── SectorHeatmap.jsx
│       │   │   ├── LapChart.jsx
│       │   │   └── SessionBanner.jsx
│       │   ├── strategy/
│       │   │   ├── TyreStintBar.jsx
│       │   │   ├── PitGauge.jsx
│       │   │   ├── ShapWaterfall.jsx
│       │   │   └── UndercutSim.jsx
│       │   ├── standings/
│       │   │   ├── DriverTable.jsx
│       │   │   ├── ConstructorTable.jsx
│       │   │   ├── PointsChart.jsx
│       │   │   └── GapChart.jsx
│       │   ├── circuit/
│       │   │   ├── CircuitMap.jsx
│       │   │   └── CircuitStats.jsx
│       │   ├── weather/
│       │   │   ├── ConditionsPanel.jsx
│       │   │   └── RainGauge.jsx
│       │   └── shared/
│       │       ├── CompoundBadge.jsx
│       │       ├── DriverBadge.jsx
│       │       ├── TeamColorStripe.jsx
│       │       ├── CountdownTimer.jsx
│       │       └── DataDelayBadge.jsx
│       ├── hooks/
│       │   ├── useLivePoll.js
│       │   ├── useRaceData.js
│       │   ├── useAuth.js
│       │   ├── useUserPrefs.js
│       │   └── useGpuTier.js
│       ├── store/
│       │   ├── sessionStore.js
│       │   └── userStore.js
│       ├── utils/
│       │   ├── f1Colors.js
│       │   ├── formatLap.js
│       │   ├── timeZone.js
│       │   ├── circuitCoords.js
│       │   └── motionPrefs.js
│       ├── firebase.js
│       └── router.jsx
└── public/
    └── assets/
        ├── circuit-maps/
        └── models/
            ├── f1-car.glb
            └── circuits/
```

---

## Build Order

### Phase 1: ML Pipeline

**`ml/features.py`**
Feature engineering from FastF1. Per driver-lap extract: `lap_number`, `tyre_age`, `compound`, `lap_time_delta` (vs personal best on compound this stint), `gap_ahead`, `gap_behind`, `track_status`, `sc_lap` (binary: 1 if track_status != CLEAR), `circuit_id`, `total_race_laps`, `pit_loss_avg`.
Targets: `should_pit_next_lap` (binary), `recommended_compound` (multiclass), `optimal_pit_lap` (int).
Exclude SC laps from degradation calculations but keep as rows with `sc_lap=1`.

**`ml/train.py`**
Three XGBoost models: `pit_classifier` (XGBClassifier, scale_pos_weight for imbalance), `compound_classifier` (XGBClassifier), `window_regressor` (XGBRegressor). StratifiedShuffleSplit. Save to `ml/models/`. Log F1-score and MAE.

**`ml/shap_explain.py`**
```python
def explain_prediction(model, feature_row: pd.DataFrame) -> dict:
    # returns {feature_name: shap_value} signed values
```

**`ml/predict.py`**
```python
def predict_pit(feature_row) -> dict:
    # returns: should_pit, compound, pit_window, confidence, shap_values
```

**`scripts/fetch_history.py`** — bulk FastF1 2018–2024, resumable.
**`scripts/export_training_data.py`** — raw → `data/processed/training_data.csv`.

---

### Phase 2: Backend

**`backend/config.py`** — dotenv loader, fail loudly on missing vars.

**`backend/schemas.py`** — Pydantic models for: `TimingEntry`, `LapData`, `SessionStatus`, `StrategyPrediction`, `ShapValue`, `UndercutRequest`, `UndercutResult`, `DriverStanding`, `ConstructorStanding`, `CircuitInfo`, `WeatherData`, `UserPrefs`.

**`backend/main.py`** — FastAPI app, CORS all origins (dev), mount all routers at `/api`, `/health` endpoint.

**`backend/services/openf1_service.py`** — async httpx: `get_session_status()`, `get_timing(session_key)`, `get_lap_data(session_key, driver, last_n)`, `get_pit_data(session_key)`, `get_car_data(session_key, driver)`.

**`backend/services/fastf1_service.py`** — `get_race_laps(year, round, driver)`, `get_session_results(year, round)`, `get_circuit_history(circuit_id)`, `get_standings(year)`, `get_calendar(year)`.

**`backend/services/model_service.py`** — load all models on startup. `predict_for_driver(session_key, driver)`, `historical_strategy(year, round, driver)`.

**`backend/services/weather_service.py`** — OpenWeatherMap client, geocode circuit city, return structured WeatherData.

**`backend/services/firebase_service.py`** — Firebase Admin SDK, `verify_token(id_token) -> uid`.

All routes as described in PRD. Always include `data_delay_seconds: 30` in live responses.

---

### Phase 3: Frontend Utilities & Stores

**`src/utils/motionPrefs.js`**
```js
export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export function ifMotion(fullFn, reducedFn = () => {}) {
  return reducedMotion ? reducedFn() : fullFn();
}
```

**`src/hooks/useGpuTier.js`**
```js
import { getGPUTier } from 'detect-gpu';
// returns { tier } where tier 0-1 = low-end (disable Tier 1 animations)
```

**`src/utils/f1Colors.js`**
```js
export const COMPOUND_COLORS = {
  SOFT: '#E8002D', MEDIUM: '#FFF200', HARD: '#F0F0F0', INTER: '#39B54A', WET: '#0067FF'
}
export const TEAM_COLORS = {
  'Red Bull': '#3671C6', 'Ferrari': '#E8002D', 'Mercedes': '#27F4D2',
  'McLaren': '#FF8000', 'Aston Martin': '#229971', 'Alpine': '#FF87BC',
  'Williams': '#64C4FF', 'Racing Bulls': '#6692FF', 'Kick Sauber': '#52E252', 'Haas': '#B6BABD'
}
```

**`src/store/sessionStore.js`** (Zustand) — `currentSession`, `timingData`, `isLive`, `lastUpdated`. Actions: `setSession`, `updateTiming`, `setLive`.

**`src/store/userStore.js`** (Zustand) — `user`, `prefs`, `gpuTier`. Actions: `setUser`, `updatePrefs`, `setGpuTier`.

---

### Phase 4: Animation Components

**`src/animations/PageTransition.jsx`**
Framer Motion wrapper. Wraps every page. On mount: `opacity 0→1`, `y 20→0`, `duration 0.4`, `ease: [0.22, 1, 0.36, 1]`. Check `reducedMotion` — skip if true.

**`src/animations/LightsOutSequence.jsx`**
Full-screen overlay. GSAP timeline:
1. 5 red circles appear left to right, stagger 0.4s each (scale 0→1, red glow)
2. Hold 0.5s
3. All 5 extinguish simultaneously (opacity 1→0, 0.2s)
4. Overlay exits (opacity 1→0, 0.3s)
5. Call `onComplete()` prop
Check `sessionStorage.getItem('lightsOutShown')` — if already shown, call `onComplete()` immediately.
After playing: `sessionStorage.setItem('lightsOutShown', '1')`.
Wrap entire sequence in `ifMotion()` — if reducedMotion, skip to onComplete immediately.

**`src/animations/LogotypeReveal.jsx`**
GSAP SplitText on "APEX" text. Each letter: `y: 60→0`, `opacity: 0→1`, stagger 0.08s, ease "back.out(1.7)".
After letters: tagline fades in (opacity 0→1, 0.4s delay 0.5s after last letter).

**`src/animations/ParticleCanvas.jsx`**
Canvas element, `position: absolute`, `inset: 0`, `pointerEvents: none`, z-index 0.
15 particles. Each: random start position, moving in a direction with slight angle variance. Speed: 0.3–0.8px/frame. Opacity: 0.03. Length: 40–80px. Colour: `#CC1E1E`.
Only render when `isLive === true` AND `gpuTier >= 2` AND NOT `reducedMotion`.
Use `requestAnimationFrame`. Cancel on unmount.

---

### Phase 5: Three.js Scenes

**`src/three/F1CarScene.jsx`**
React Three Fiber canvas. Load `public/assets/models/f1-car.glb` via `useGLTF`.
- Camera: perspective, position [0, 1.5, 4], looking at [0, 0.5, 0]
- Lighting: ambient (0.3 intensity) + directional from above-left + red point light at [2, 1, 2] for rim light
- Car: auto-rotate Y axis, 0.003 rad/frame
- Environment: dark background #0D0D0D
- Use `<Suspense>` with fallback spinner
- Only mount when `gpuTier >= 2`

**`src/three/CircuitScene.jsx`**
Props: `circuitId` (string). Load matching GLTF from `public/assets/models/circuits/{circuitId}.glb`.
- Camera starts at [0, 8, 0] looking down, animates along a bezier path above the track (GSAP + R3F camera controls)
- Loop: 8 second continuous flyover
- Track material: emissive white `#E8E8E0`, slight glow
- Background: `#0D0D0D`
- Only mount when `gpuTier >= 2`
- Fallback: SVG circuit map

**`src/three/TyreScene.jsx`**
Props: `compound` (string). Simple torus geometry approximating a tyre.
- Material colour driven by `COMPOUND_COLORS[compound]`
- Slow auto-rotate on Y axis
- Width: 200px, height: 200px, inline in Strategy page hero

---

### Phase 6: Layout & Navigation

**`src/components/layout/Navbar.jsx`**
56px height. Background `#111111`. 4px red top border. Left: "APEX" in Orbitron red + session state chip. Centre: nav links (Dashboard, Live, Strategy, H2H, Standings, Calendar, Circuit, Weather). Right: DataDelayBadge (if live) + auth button. Active link: red 2px underline.

**`src/components/layout/Sidebar.jsx`**
Desktop left sidebar. 64px collapsed, 200px expanded. Page icons + labels. Active: 3px red left border. Mobile: replaced by bottom tab bar.

**`src/components/layout/PageShell.jsx`**
Wraps all pages. Renders `<PageTransition>`. Conditionally renders `<ParticleCanvas>`. Provides consistent padding and layout.

---

### Phase 7: Shared Components

**`src/components/shared/CompoundBadge.jsx`**
Props: `compound`, `size` ('sm'|'lg'). Pill with compound colour background. Compound initial + name. Box-shadow: `0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)`. Framer Motion `scale` animation on change (scale 0.8→1, 200ms).

**`src/components/shared/DataDelayBadge.jsx`**
Amber pill. "~30s delayed". Subtle opacity breathe (CSS animation, 3s cycle). Always visible during live sessions — never hide or remove.

**`src/components/shared/CountdownTimer.jsx`**
Props: `targetDate`. Updates every second. Format: `DD HH:MM:SS` in Orbitron. Red colour on final 24h.

---

### Phase 8: Live Timing Components

**`src/components/live/TimingTable.jsx`**
Framer Motion `AnimatePresence` + `layout` prop on each row. Each row keyed by driver number.
On position change: rows animate vertically to new position (spring, stiffness 200, damping 25).
Fastest lap row: brief purple flash (200ms transition on backgroundColor, then hold purple text).
DO NOT animate cell values. Only row position changes animate.
Columns: Pos, Driver (with TeamColorStripe), Gap, Interval, Last Lap (Orbitron), Best Lap (Orbitron), Compound (CompoundBadge), Age, Pits, DRS indicator.

**`src/components/live/LapChart.jsx`**
D3 bump/position chart. On mount: lines draw in using `stroke-dasharray` + `stroke-dashoffset` trick, 600ms ease-out. One line per driver in team colour. Position changes: D3 transition 300ms. Pit stops: circle markers, scale in on mount (D3 transition). Hover: vertical cursor + floating tooltip card.

**`src/components/live/SectorHeatmap.jsx`**
Grid. On new data: cell background-color transitions 200ms CSS. Colour scale: green (#1B7A1B) to red (#AA1515) based on rank within sector. Orbitron values inside cells.

**`src/components/live/SessionBanner.jsx`**
When session goes LIVE: trigger `<LightsOutSequence>` overlay, then show banner. Banner slides down from top (Framer Motion y: -52→0, spring). Pulsing red dot (CSS animation).

---

### Phase 9: Strategy Components

**`src/components/strategy/TyreStintBar.jsx`**
D3 horizontal bar. On mount: stints draw in left-to-right (D3 transition, 80ms stagger per stint, 800ms total). Predicted pit lap line: GSAP `drawSVG` plugin — line extends from left to right, 600ms. Confidence band: opacity 0→0.08, 400ms delay. Hover tooltip with D3.

**`src/components/strategy/PitGauge.jsx`**
SVG circular gauge 320px. Needle: `transform-origin: 50% 85%`. On value change: spring physics CSS transition (`transition: transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)`).
When pit window opens: GSAP timeline — needle snap to right, face background pulses red (opacity 0→0.15→0 on red overlay, 1.5s loop), "PIT NOW" text scales in (`scale: 0→1.1→1`, 300ms, ease back.out).

**`src/components/strategy/ShapWaterfall.jsx`**
Horizontal bar chart. On mount: GSAP `staggerFrom` — all bars start at width 0, stagger to full width, 40ms between bars. Red bars (pit factors) stagger from right. Grey bars (stay-out factors) stagger from left.

**`src/components/strategy/UndercutSim.jsx`**
On slider change: probability gauge needle animates with spring (300ms). Probability colour transitions: <40% grey, 40–60% amber, >60% green, >80% bright green + pulse.

---

### Phase 10: Remaining Page Components

**`src/components/standings/DriverTable.jsx`**
After new race result loads: GSAP `stagger` to animate rows to new positions (400ms, 30ms stagger between rows). P1 row: gold tint `rgba(180,140,0,0.08)`. P2: silver. P3: bronze.

**`src/components/standings/PointsChart.jsx`**
D3 line chart. Lines draw in on mount with stagger — 100ms offset between each driver line. Toggle drivers/constructors with Framer Motion AnimatePresence.

**`src/components/circuit/CircuitMap.jsx`**
SVG path draw-in: S1 draws first (GSAP drawSVG, 600ms), then S2 (300ms delay), then S3 (600ms delay). DRS zones fade in after track complete. If `gpuTier >= 2`: also render `<CircuitScene>` above the SVG map.

**`src/components/circuit/CircuitStats.jsx`**
On mount: all numerical stats count up from 0 (GSAP ticker, 600ms, ease power2.out).

**`src/pages/Splash.jsx`**
Full page. F1CarScene (Three.js, conditional on gpuTier). LogotypeReveal (GSAP). Loading progress bar (thin red line, tied to asset load). On assets loaded + reveal complete: navigate to Dashboard with PageTransition.

**`src/pages/Circuit.jsx`**
LightsOutSequence NOT used here. CircuitScene (Three.js flyover) as hero. CircuitMap SVG below. CircuitStats with count-up. Historical winners table with Framer Motion stagger on scroll into view (IntersectionObserver).

---

## Skeuomorphic CSS Rules (Apply in Every Component)

```css
/* Carbon fibre panel */
background-color: #1A1A1A;
background-image: repeating-linear-gradient(
  45deg, transparent, transparent 2px,
  rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px
);
box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 16px rgba(0,0,0,0.6);

/* Physical button */
box-shadow: 0 4px 0 #111, 0 5px 6px rgba(0,0,0,0.5);
/* Button pressed state */
box-shadow: 0 1px 0 #111; transform: translateY(3px);

/* Brushed metal rings */
background: radial-gradient(ellipse at center, #3A3A3A 0%, #282828 100%);

/* Card hover lift */
transition: transform 150ms ease, box-shadow 150ms ease;
&:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0,0,0,0.7); }
```

**Never:** white backgrounds, blur/backdrop-filter, border-radius > 8px on panels, animations > 600ms for data, Three.js on LiveTiming page.

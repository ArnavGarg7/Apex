# APEX | F1 Intelligence Dashboard

**[🔴 LIVE DEMO: apex-92c8d.web.app](https://apex-92c8d.web.app)**

![APEX Splash](https://raw.githubusercontent.com/ArnavGarg7/Apex/main/splash_screen_preview.png)

APEX is a premium Formula 1 data analytics and strategy platform. It combines live timing, historical telemetry analysis, and advanced race insights into a sleek, high-performance interface.

## 🚀 Key Features
- **3D System Uplink**: Interactive 3D F1 car visualization on start-up.
- **Telemetry Explorer**: Real telemetry-plotted 2D circuit maps — speed, brake, and throttle heatmaps for every F1 circuit.
- **Head-to-Head Compare**: Lap-by-lap telemetry comparison between any two drivers across any season.
- **Championship**: Full WDC/WCC standings history with visual gap charts.
- **Encyclopedia**: Complete historical database of all-time F1 drivers and constructors (paginated).
- **Teammate Battle**: In-season head-to-head qualifying and race statistics per team.
- **Strategy Predictor**: XGBoost-powered model for predicting race outcomes and tyre degradation (In-Dev).
- **Global Circuit Hub**: Metadata and topology for all 24 historical and modern F1 circuits.
- **Live Timing**: Real-time race timing with 30s delay via OpenF1 API.

## 🛠️ Technology Stack
- **Frontend**: React, Vite, Three.js (R3F), D3.js, Zustand.
- **Backend**: FastAPI, FastF1, Firebase Admin.
- **AI/ML**: XGBoost, Scikit-learn.
- **Data**: OpenF1 (live), Jolpica/Ergast (historical), FastF1 (telemetry).
- **UI**: Vanilla CSS with premium skeuomorphic components.

## 🏁 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- [OpenWeatherMap API Key](https://openweathermap.org/)

### Installation
1. **Clone the repo**
   ```bash
   git clone https://github.com/ArnavGarg7/Apex.git
   cd Apex
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Configuration**
   Create a `.env` in the root and add:
   ```env
   OPENWEATHER_API_KEY=your_key_here
   APP_ENV=development
   ```

5. **Run Application**
   - Backend: `uvicorn backend.main:app --reload --port 8001`
   - Frontend: `npm run dev`

## 🌟 Future Upgrades
- [ ] **Radio Sentiment Analysis**: AI-driven mood tracking from team radio.
- [ ] **Live Pit Stop Predictor**: Real-time probability of window openings.
- [ ] **3D Track Flyover**: Interactive lap walkthroughs.
- [ ] **H2H Encyclopedia**: Direct historical comparisons between any two legends.

---
*Built by Arnav Garg — for the enthusiasts of the fastest sport on earth.*

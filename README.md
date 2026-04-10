# APEX | F1 Intelligence Dashboard

![APEX Splash](https://raw.githubusercontent.com/ArnavGarg7/Apex/main/splash_screen_preview.png)

APEX is a premium Formula 1 data analytics and strategy platform. It combines live timing, historical telemetry analysis, and AI-powered race insights into a sleek, high-performance interface.

## 🚀 Key Features
- **3D System Uplink**: Interactive 3D F1 car visualization on start-up.
- **AI News Intelligence**: Real-time F1 news aggregation powered by Google Gemini 2.0 Flash.
- **Telemetry Explorer**: D3.js animated charts for speed, throttle, and RPM comparison.
- **Encyclopedia**: Complete historical database of all-time drivers and constructors (paginated).
- **Strategy Predictor**: XGBoost-powered model for predicting race outcomes and tyre degradation (In-Dev).
- **Global Circuit Hub**: Metadata and topology for all 24 historical and modern F1 circuits.

## 🛠️ Technology Stack
- **Frontend**: React, Vite, Three.js (R3F), D3.js, Zustand.
- **Backend**: FastAPI, FastF1, Firebase Admin.
- **AI/ML**: Google Gemini (GenAI), XGBoost, Scikit-learn.
- **UI**: Vanilla CSS with premium skeuomorphic components.

## 🏁 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- [Gemini API Key](https://aistudio.google.com/)
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
   GEMINI_API_KEY=your_key_here
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
*Built for the enthusiasts of the fastest sport on earth.*

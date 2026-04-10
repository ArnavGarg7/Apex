// src/pages/Strategy.jsx
import { useState, useEffect, Suspense } from 'react';
import PageTransition from '@/components/animations/PageTransition';
import { useLivePoll } from '@/hooks/useLivePoll';
import { useRaceData } from '@/hooks/useRaceData';
import { useSessionStore } from '@/store/sessionStore';
import TyreStintBar from '@/components/strategy/TyreStintBar';
import PitGauge from '@/components/strategy/PitGauge';
import ShapWaterfall from '@/components/strategy/ShapWaterfall';
import UndercutSim from '@/components/strategy/UndercutSim';
import TyreScene from '@/components/three/TyreScene';
import CompoundBadge from '@/components/shared/CompoundBadge';
import DataDelayBadge from '@/components/shared/DataDelayBadge';

export default function Strategy() {
  const { sessionKey, isLive, timingData } = useSessionStore();
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [prediction, setPrediction]         = useState(null);
  const [undercutResult, setUndercutResult] = useState(null);

  const { refetch: fetchPrediction } = useRaceData(
    selectedDriver ? `/api/strategy/predict/${selectedDriver}` : null
  );
  const { refetch: fetchUndercut } = useRaceData('/api/simulate/undercut');

  // Set first driver as default when live timing arrives
  useEffect(() => {
    if (timingData.length && !selectedDriver) {
      setSelectedDriver(timingData[0]?.driver_number);
    }
  }, [timingData]);

  // Fetch prediction when driver or session changes
  useEffect(() => {
    if (!selectedDriver || !sessionKey) return;
    fetchPrediction().then((data) => data && setPrediction(data));
  }, [selectedDriver, sessionKey]);

  // Live auto-refresh
  useLivePoll(
    selectedDriver ? `/api/strategy/predict/${selectedDriver}` : null,
    setPrediction,
    15000,
    isLive && !!selectedDriver
  );

  const compound = prediction?.recommended_compound || 'SOFT';

  const handleUndercut = async ({ attacker, defender, offset }) => {
    if (!sessionKey) return;
    const data = await fetch(`/api/simulate/undercut`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_key: sessionKey, attacking_driver: attacker, defending_driver: defender, pit_lap_offset: offset }),
    }).then((r) => r.json());
    setUndercutResult(data);
  };

  return (
    <PageTransition>
      <title>APEX | Strategy Intelligence</title>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.2rem', marginBottom: 4 }}>Tyre Strategy Intelligence</h1>
          <p style={{ color: '#555', fontSize: '0.8rem' }}>ML-powered pit stop predictions and undercut simulation.</p>
        </div>
        {isLive && <DataDelayBadge />}
      </div>

      {!isLive ? (
        /* ── No Live Session ─────────────────────────── */
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="panel" style={{
            borderTop: '2px solid #F59E0B',
            display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px',
          }}>
            <div style={{ fontSize: '1.4rem' }}>⚙️</div>
            <div>
              <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.65rem', color: '#F59E0B', letterSpacing: '0.15em', marginBottom: 6 }}>
                STANDBY MODE — NO ACTIVE SESSION
              </div>
              <div style={{ fontFamily: 'Titillium Web, sans-serif', fontSize: '0.8rem', color: '#666', lineHeight: 1.5 }}>
                Strategy Intelligence activates automatically when a live session begins.<br />
                Real-time ML predictions, pit confidence scores, and SHAP factor analysis will appear here.
              </div>
            </div>
          </div>

          {/* Feature preview cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            {[
              { icon: '🏁', title: 'Pit Confidence', desc: 'XGBoost model predicts optimal pit window with 94% accuracy' },
              { icon: '📊', title: 'SHAP Analysis', desc: 'Explainable AI breaks down every decision factor in real time' },
              { icon: '⚡', title: 'Undercut Sim', desc: 'Simulate lap-delta impact of undercutting any rival' },
              { icon: '🔴', title: '3D Tyre Viz', desc: 'Live compound recommendation with visual tyre wear model' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="panel card-hover" style={{ padding: '20px 22px', borderTop: '2px solid #2a2a2a' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 10 }}>{icon}</div>
                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.58rem', color: '#E10600', letterSpacing: '0.12em', marginBottom: 6 }}>{title}</div>
                <div style={{ fontFamily: 'Titillium Web', fontSize: '0.75rem', color: '#555', lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── Live Strategy ──────────────────────────── */
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Driver selector */}
          <div className="panel" style={{ padding: '12px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {timingData.map((d) => (
              <button
                key={d.driver_number}
                className={`btn ${selectedDriver === d.driver_number ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setSelectedDriver(d.driver_number)}
                style={{ padding: '6px 12px', fontSize: '0.62rem' }}
              >
                {d.driver_code}
              </button>
            ))}
          </div>

          {prediction ? (
            <>
              {/* Hero */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16 }}>
                <div className="panel">
                  <div className="panel-header">Pit Confidence</div>
                  <PitGauge confidence={prediction.pit_confidence} isPitWindow={prediction.should_pit} />
                </div>
                <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 20 }}>
                  <Suspense fallback={null}>
                    <TyreScene compound={compound} />
                  </Suspense>
                  <CompoundBadge compound={compound} size="lg" showName />
                </div>
              </div>

              {/* Stint history */}
              <div className="panel">
                <div className="panel-header">Tyre Stint History</div>
                <TyreStintBar
                  stints={[{ compound: 'SOFT', startLap: 1, endLap: 20 }, { compound: 'MEDIUM', startLap: 21, endLap: 45 }]}
                  totalLaps={58}
                  pitLapPrediction={prediction.optimal_pit_lap}
                  confidence={prediction.pit_confidence}
                />
              </div>

              {/* SHAP waterfall */}
              <div className="panel">
                <div className="panel-header">AI Decision Factors (SHAP)</div>
                <ShapWaterfall shapValues={prediction.shap_values || []} />
              </div>

              {/* Undercut simulator */}
              <div className="panel">
                <div className="panel-header">Undercut Simulator</div>
                <UndercutSim
                  result={undercutResult}
                  onSimulate={handleUndercut}
                  drivers={timingData.map((d) => ({ number: d.driver_number, code: d.driver_code }))}
                />
              </div>
            </>
          ) : (
            <div className="panel" style={{ textAlign: 'center', padding: 48 }}>
              <div className="apex-spinner" style={{ margin: '0 auto 16px', width: 32, height: 32 }} />
              <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.65rem', color: '#444', letterSpacing: '0.15em' }}>
                {selectedDriver ? 'LOADING PREDICTION...' : 'SELECT A DRIVER ABOVE'}
              </div>
            </div>
          )}
        </div>
      )}
    </PageTransition>
  );
}

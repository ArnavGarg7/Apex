// src/pages/LiveTiming.jsx
import { useState } from 'react';
import PageTransition from '@/components/animations/PageTransition';
import { useLivePoll } from '@/hooks/useLivePoll';
import { useSessionStore } from '@/store/sessionStore';
import TimingTable from '@/components/live/TimingTable';
import SectorHeatmap from '@/components/live/SectorHeatmap';
import LapChart from '@/components/live/LapChart';
import DataDelayBadge from '@/components/shared/DataDelayBadge';
import NextRaceCountdown from '@/components/shared/NextRaceCountdown';

export default function LiveTiming() {
  const { setSession, updateTiming, setLive, isLive, currentSession, timingData } = useSessionStore();
  const [tab, setTab] = useState('timing');

  useLivePoll('/api/live/session', (d) => { setSession(d); setLive(d?.is_live || false); }, 10000);
  useLivePoll('/api/live/timing',  updateTiming, 5000, true);

  return (
    <PageTransition>
      <title>APEX | Live Timing</title>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontSize: '1.2rem' }}>Live Timing</h1>
          {isLive && <span className="badge badge-live">LIVE</span>}
          {isLive && <DataDelayBadge />}
        </div>
        {isLive && (
          <div className="seg-control">
            {[['timing', 'TIMING'], ['sectors', 'SECTORS'], ['chart', 'LAP CHART']].map(([k, l]) => (
              <button key={k} className={`seg-btn ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)} id={`lt-tab-${k}`}>
                {l}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLive ? (
        // ── Live data ────────────────────────────────────
        <div className="panel">
          {tab === 'timing' && <TimingTable data={timingData} />}
          {tab === 'sectors' && <SectorHeatmap data={timingData} />}
          {tab === 'chart' && (
            <LapChart
              data={Object.fromEntries(timingData.map((d) => [d.driver_code, { laps: [], teamName: d.team_name, pitLaps: [] }]))}
              width={700}
              height={320}
            />
          )}
        </div>
      ) : (
        // ── No race: countdown widget ─────────────────────
        <div style={{ display: 'grid', gap: 20 }}>
          {/* Status banner */}
          <div className="panel" style={{
            display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px',
            borderLeft: '3px solid #333',
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#333' }} />
            <div>
              <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.65rem', color: '#555', letterSpacing: '0.15em' }}>
                NO ACTIVE SESSION
              </div>
              <div style={{ fontFamily: 'Titillium Web, sans-serif', fontSize: '0.75rem', color: '#444', marginTop: 2 }}>
                Live timing activates automatically when a session begins.
              </div>
            </div>
          </div>

          {/* Countdown to next race */}
          <div className="panel" style={{ borderTop: '2px solid #E10600' }}>
            <div className="panel-header">Next Grand Prix</div>
            <NextRaceCountdown />
          </div>
        </div>
      )}
    </PageTransition>
  );
}

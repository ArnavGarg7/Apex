// src/pages/Championship.jsx — Monte Carlo Championship Simulation
import { useState } from 'react';
import PageTransition from '@/components/animations/PageTransition';
import { useRaceData } from '@/hooks/useRaceData';
import { getTeamColor } from '@/utils/f1Colors';

export default function Championship() {
  const [year, setYear] = useState(2024);
  const [remaining, setRemaining] = useState(5); // Default to simulating 5 out remaining
  
  const { data: calendar } = useRaceData(`/api/calendar/${year}`, { immediate: true, deps: [year] });
  const { data: simData, loading, error, refetch } = useRaceData(`/api/simulate/monte-carlo?year=${year}&remaining=${remaining}`);

  const drivers = simData?.drivers || [];
  const teams = simData?.constructors || [];

  return (
    <PageTransition>
      <title>APEX | Championship Simulator</title>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.2rem', marginBottom: 4 }}>Championship Simulator</h1>
          <p style={{ color: '#555', fontSize: '0.8rem' }}>Monte Carlo probability engine for world titles.</p>
        </div>
      </div>

      {/* Control deck */}
      <div className="panel" style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
        <div className="field">
          <label className="label">SEASON</label>
          <select value={year} onChange={e => { setYear(Number(e.target.value)); }} className="apex-select" style={{ width: 120 }}>
            {[2026,2025,2024,2023,2022,2021].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="field">
          <label className="label">SIMULATE REMAINDER FROM</label>
          <select value={remaining} onChange={e => { setRemaining(Number(e.target.value)); }} className="apex-select" style={{ width: 240 }} disabled={!calendar}>
            {!calendar ? <option value={remaining}>Loading circuits...</option> : 
              calendar.slice().reverse().map((c, i) => (
                <option key={c.round_number} value={i + 1}>
                  {i + 1} Race{i+1 !== 1 ? 's' : ''} Left (From {c.event_name})
                </option>
              ))
            }
          </select>
        </div>

        <button
          className="btn btn-primary"
          onClick={refetch}
          disabled={loading}
          style={{ height: 38, fontSize: '0.65rem', letterSpacing: '0.12em', marginLeft: 'auto' }}
        >
          {loading ? 'COMPUTING...' : 'RUN MONTE CARLO'}
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 16 }}>
          <div className="apex-spinner" style={{ width: 44, height: 44, borderWidth: 3 }} />
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.6rem', color: '#444', letterSpacing: '0.2em', textShadow: '0 0 10px rgba(255,255,255,0.1)' }}>
            RUNNING {simData?.iterations || 1000} ITERATIONS...
          </div>
        </div>
      ) : error ? (
        <div className="panel" style={{ borderTop: '2px solid #E10600', textAlign: 'center', padding: '36px 24px' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.65rem', color: '#E10600', letterSpacing: '0.15em', marginBottom: 8 }}>
            SIMULATION FAILED
          </div>
          <div style={{ fontSize: '0.75rem', color: '#555', fontFamily: 'Titillium Web' }}>{error}</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          
          {/* Driver Championship */}
          <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
             <div className="panel-header" style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
               DRIVERS' CHAMPIONSHIP
             </div>
             <div style={{ display: 'flex', flexDirection: 'column' }}>
               {drivers.map((d, i) => {
                 const color = getTeamColor(d.color_ref);
                 const prob = d.probability;
                 return (
                   <div key={d.driver_code} style={{ 
                     display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px',
                     borderBottom: '1px solid rgba(255,255,255,0.03)', position: 'relative',
                     overflow: 'hidden'
                   }}>
                     {/* Progress Bar Background */}
                     <div style={{
                       position: 'absolute', top: 0, left: 0, height: '100%',
                       width: `${prob}%`, background: `linear-gradient(90deg, ${color}22 0%, ${color}11 100%)`,
                       zIndex: 0, transition: 'width 1s cubic-bezier(0.2, 0.8, 0.2, 1)'
                     }} />
                     {color && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: color }} />}
                     
                     <div style={{ zIndex: 1, fontFamily: 'Orbitron', fontSize: '1.1rem', fontWeight: 800, color: '#333', width: 24 }}>
                       {i + 1}
                     </div>
                     <div style={{ zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
                       <span style={{ fontFamily: 'Titillium Web', fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
                         {d.name.toUpperCase()}
                       </span>
                       <span style={{ fontFamily: 'Orbitron', fontSize: '0.55rem', color: color || '#555', letterSpacing: '0.05em' }}>
                         {d.current_points} PTS
                       </span>
                     </div>
                     <div style={{ zIndex: 1, fontFamily: 'Orbitron', fontWeight: 900, fontSize: '1.2rem', color: prob > 50 ? color : '#e0e0e0', textShadow: prob > 50 ? `0 0 12px ${color}` : 'none' }}>
                       {prob}%
                     </div>
                   </div>
                 );
               })}
             </div>
          </div>

          {/* Constructors Championship */}
          <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
             <div className="panel-header" style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
               CONSTRUCTORS' CHAMPIONSHIP
             </div>
             <div style={{ display: 'flex', flexDirection: 'column' }}>
               {teams.map((t, i) => {
                 const col = getTeamColor(t.team_name);
                 const p = t.probability;
                 return (
                   <div key={t.team_name} style={{ 
                     display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px',
                     borderBottom: '1px solid rgba(255,255,255,0.03)', position: 'relative',
                     overflow: 'hidden'
                   }}>
                     <div style={{
                       position: 'absolute', top: 0, left: 0, height: '100%',
                       width: `${p}%`, background: `linear-gradient(90deg, ${col}22 0%, ${col}11 100%)`,
                       zIndex: 0, transition: 'width 1s cubic-bezier(0.2, 0.8, 0.2, 1)'
                     }} />
                     {col && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: col }} />}
                     
                     <div style={{ zIndex: 1, fontFamily: 'Orbitron', fontSize: '1.1rem', fontWeight: 800, color: '#333', width: 24 }}>
                       {i + 1}
                     </div>
                     <div style={{ zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
                       <span style={{ fontFamily: 'Titillium Web', fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
                         {t.name.toUpperCase()}
                       </span>
                       <span style={{ fontFamily: 'Orbitron', fontSize: '0.55rem', color: col || '#555', letterSpacing: '0.05em' }}>
                         {t.current_points} PTS
                       </span>
                     </div>
                     <div style={{ zIndex: 1, fontFamily: 'Orbitron', fontWeight: 900, fontSize: '1.2rem', color: p > 50 ? col : '#e0e0e0', textShadow: p > 50 ? `0 0 12px ${col}` : 'none' }}>
                       {p}%
                     </div>
                   </div>
                 );
               })}
             </div>
          </div>
          
        </div>
      )}
    </PageTransition>
  );
}

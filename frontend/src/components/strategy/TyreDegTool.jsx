import { useState } from 'react';
import { useRaceData } from '@/hooks/useRaceData';

const YEARS = [2025, 2024, 2023, 2022, 2021];

export default function TyreDegTool() {
  const [year, setYear] = useState(2025);
  const [round, setRound] = useState(1);

  const handleYearChange = (newYear) => {
    setYear(Number(newYear));
    setRound(1); // reset round when year changes
  };
  
  // Fetch calendar for current year to get circuit names
  const { data: calendar } = useRaceData(`/api/calendar/${year}`, { immediate: true, deps: [year] });
  
  const { data, loading, error } = useRaceData(
    `/api/historical/tyre-deg?year=${year}&round=${round}`,
    { immediate: true, deps: [year, round] }
  );

  const rounds = calendar || [];
  const currentEvent = rounds.find(r => r.round_number === round);

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="panel-header" style={{ marginBottom: 4 }}>FP2 Long-Run Deg Delta</div>
          <div style={{ fontFamily: 'Titillium Web', fontSize: '0.65rem', color: '#666' }}>
            Historical tyre degradation analysis (seconds lost per lap).
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={year} onChange={e => handleYearChange(e.target.value)} className="apex-select" style={{ padding: '4px 8px', fontSize: '0.65rem' }}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={round} onChange={e => setRound(Number(e.target.value))} className="apex-select" style={{ padding: '4px 8px', fontSize: '0.65rem', minWidth: 160 }}>
            {rounds.length > 0 ? (
              rounds.map(r => (
                <option key={r.round_number} value={r.round_number}>
                  R{r.round_number} — {r.event_name.replace('Grand Prix', 'GP')}
                </option>
              ))
            ) : (
              <option value={round}>Round {round}</option>
            )}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '24px 0', justifyContent: 'center' }}>
          <div className="apex-spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
          <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.55rem', color: '#444', letterSpacing: '0.15em' }}>ANALYZING STINTS...</span>
        </div>
      ) : error || !data?.degradation_s_per_lap || Object.keys(data.degradation_s_per_lap).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', fontFamily: 'Orbitron, monospace', fontSize: '0.6rem', color: '#444' }}>
          NO LONG-RUN DATA FOR {currentEvent?.event_name?.toUpperCase() || `ROUND ${round}`}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8 }}>
            {['SOFT', 'MEDIUM', 'HARD'].map(comp => {
              const compData = data.degradation_s_per_lap[comp]; // Now an object
              const val = compData?.val;
              const cColor = comp === 'SOFT' ? '#E10600' : comp === 'MEDIUM' ? '#F59E0B' : '#FFFFFF';
              
              return (
                <div key={comp} style={{ 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid rgba(255,255,255,0.05)', 
                  borderRadius: 6, padding: '12px', textAlign: 'center',
                  display: 'flex', flexDirection: 'column', gap: 4
                }}>
                  <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.5rem', color: cColor, letterSpacing: '0.1em' }}>{comp}</div>
                  <div style={{ fontFamily: 'Orbitron', fontWeight: 800, fontSize: '1.1rem', color: val ? '#fff' : '#444' }}>
                    {val ? `+${val.toFixed(3)}s` : '--'}
                  </div>
                  {compData && (
                    <div style={{ marginTop: 4 }}>
                      <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.45rem', color: '#E10600', fontWeight: 600 }}>BEST: {compData.best_driver}</div>
                      <div style={{ fontFamily: 'Titillium Web', fontSize: '0.5rem', color: '#666' }}>{compData.laps_analyzed} Laps</div>
                    </div>
                  )}
                  {!compData && <div style={{ fontFamily: 'Titillium Web', fontSize: '0.55rem', color: '#444' }}>NO DATA</div>}
                </div>
              );
            })}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: 6, borderLeft: '3px solid #E10600' }}>
            <div>
              <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.45rem', color: '#666', letterSpacing: '0.1em' }}>AI TACTICAL RECOMMENDATION</div>
              <div style={{ fontFamily: 'Titillium Web', fontSize: '0.8rem', fontWeight: 700, color: '#ccc' }}>Predicted Race Strategy</div>
            </div>
            <div style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: '1.2rem', color: '#E10600' }}>
              {data.predicted_strategy.toUpperCase()}
            </div>
          </div>
          
          <div style={{ fontFamily: 'Titillium Web', fontSize: '0.6rem', color: '#444', textAlign: 'right' }}>
            {data.note}
          </div>
        </>
      )}
    </div>
  );
}

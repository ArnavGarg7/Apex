// src/pages/Standings.jsx
// 2026 = dynamic polling (live race season); 2025 and earlier = static fetched once.
import { useState, useEffect } from 'react';
import PageTransition from '@/components/animations/PageTransition';
import { useRaceData } from '@/hooks/useRaceData';
import DriverTable from '@/components/standings/DriverTable';
import ConstructorTable from '@/components/standings/ConstructorTable';
import GapChart from '@/components/standings/GapChart';
import { useUserStore } from '@/store/userStore';

export default function Standings() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(2025);
  const [tab, setTab] = useState('drivers');
  const { data, loading, refetch } = useRaceData(`/api/standings/${year}`, { immediate: true, deps: [year] });


  // For current season only: auto-refresh every 5 minutes
  useEffect(() => {
    if (year !== currentYear) return;
    const id = setInterval(() => refetch(), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [year, currentYear]);

  const drivers      = data?.drivers       || [];
  const constructors = data?.constructors  || [];
  const list         = tab === 'drivers' ? drivers : constructors;

  return (
    <PageTransition>
      <title>APEX | Championship Standings</title>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.2rem', marginBottom: 4 }}>Championship Standings</h1>
          <p style={{ color: '#555', fontSize: '0.8rem' }}>
            {year === currentYear ? 'Live season — auto-refreshes every 5 minutes.' : `Season ${year} — static results.`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="apex-select"
            style={{ width: 'auto', minWidth: 90 }}
            id="standings-year-select"
          >
            {Array.from({ length: 9 }, (_, i) => currentYear - i + 1).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <div className="seg-control">
            <button className={`seg-btn ${tab === 'drivers' ? 'active' : ''}`} onClick={() => setTab('drivers')} id="tab-drivers">DRIVERS</button>
            <button className={`seg-btn ${tab === 'constructors' ? 'active' : ''}`} onClick={() => setTab('constructors')} id="tab-constructors">CONSTRUCTORS</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="apex-spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
        </div>
      ) : list.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '60px 24px', color: '#444' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.7rem', letterSpacing: '0.2em', marginBottom: 8 }}>
            NO STANDINGS DATA FOR {year}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#333' }}>Try 2018–2025 for fully cached data.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 20 }}>
          {/* Live update badge for 2026 */}
          {year === currentYear && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#39B54A', boxShadow: '0 0 8px #39B54A', animation: 'breathe 2s ease-in-out infinite' }} />
              <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.55rem', color: '#39B54A', letterSpacing: '0.15em' }}>
                LIVE SEASON — AUTO-UPDATING
              </span>
            </div>
          )}

          {/* Standings table */}
          <div className="panel" style={{ overflowX: 'auto' }}>
            {tab === 'drivers'      && <DriverTable standings={drivers} />}
            {tab === 'constructors' && <ConstructorTable standings={constructors} />}
          </div>

          {/* Gap chart */}
          {list.length > 1 && (
            <div className="panel">
              <div className="panel-header">Points Gap to Leader</div>
              <GapChart
                standings={list}
                width={700}
                height={Math.min(360, list.length * 30 + 48)}
              />
            </div>
          )}
        </div>
      )}
    </PageTransition>
  );
}

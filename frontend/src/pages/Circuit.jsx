// src/pages/Circuit.jsx — Full circuit explorer with rich SVG maps + circuit switcher
import { useState, useEffect } from 'react';
import PageTransition from '@/components/animations/PageTransition';
import { useRaceData } from '@/hooks/useRaceData';

// Comprehensive list of all F1 circuits with their canonical IDs for FastF1 lookup
const ALL_CIRCUITS = [
  { id: 'bahrain',     name: 'Bahrain',      country: 'BH', flag: '🇧🇭' },
  { id: 'saudi_arabia',name: 'Saudi Arabia', country: 'SA', flag: '🇸🇦' },
  { id: 'australia',   name: 'Australia',    country: 'AU', flag: '🇦🇺' },
  { id: 'japan',       name: 'Japan',        country: 'JP', flag: '🇯🇵' },
  { id: 'china',       name: 'China',        country: 'CN', flag: '🇨🇳' },
  { id: 'miami',       name: 'Miami',        country: 'US', flag: '🇺🇸' },
  { id: 'imola',       name: 'Imola',        country: 'IT', flag: '🇮🇹' },
  { id: 'monaco',      name: 'Monaco',       country: 'MC', flag: '🇲🇨' },
  { id: 'canada',      name: 'Canada',       country: 'CA', flag: '🇨🇦' },
  { id: 'spain',       name: 'Spain',        country: 'ES', flag: '🇪🇸' },
  { id: 'austria',     name: 'Austria',      country: 'AT', flag: '🇦🇹' },
  { id: 'silverstone', name: 'Silverstone',  country: 'GB', flag: '🇬🇧' },
  { id: 'hungary',     name: 'Hungary',      country: 'HU', flag: '🇭🇺' },
  { id: 'spa',         name: 'Spa',          country: 'BE', flag: '🇧🇪' },
  { id: 'zandvoort',   name: 'Zandvoort',    country: 'NL', flag: '🇳🇱' },
  { id: 'monza',       name: 'Monza',        country: 'IT', flag: '🇮🇹' },
  { id: 'baku',        name: 'Baku',         country: 'AZ', flag: '🇦🇿' },
  { id: 'singapore',   name: 'Singapore',    country: 'SG', flag: '🇸🇬' },
  { id: 'austin',      name: 'Austin (COTA)',country: 'US', flag: '🇺🇸' },
  { id: 'mexico',      name: 'Mexico City',  country: 'MX', flag: '🇲🇽' },
  { id: 'brazil',      name: 'São Paulo',    country: 'BR', flag: '🇧🇷' },
  { id: 'vegas',       name: 'Las Vegas',    country: 'US', flag: '🇺🇸' },
  { id: 'qatar',       name: 'Qatar',        country: 'QA', flag: '🇶🇦' },
  { id: 'abu_dhabi',   name: 'Abu Dhabi',    country: 'AE', flag: '🇦🇪' },
];

function CircuitSVG({ topology, loading }) {
  if (loading) return (
    <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="apex-spinner" style={{ margin: '0 auto 12px', width: 28, height: 28 }} />
        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.55rem', color: '#444', letterSpacing: '0.2em' }}>LOADING TELEMETRY</div>
      </div>
    </div>
  );

  if (!topology || topology.length === 0) return (
    <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.6rem', color: '#333', letterSpacing: '0.15em' }}>
        TOPOLOGY UNAVAILABLE
      </div>
    </div>
  );

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  topology.forEach(p => {
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
    if (-p.y < minY) minY = -p.y; if (-p.y > maxY) maxY = -p.y;
  });
  const pw  = Math.max(maxX - minX, maxY - minY) * 0.12;
  const vb  = `${minX - pw} ${minY - pw} ${(maxX - minX) + pw * 2} ${(maxY - minY) + pw * 2}`;
  const sw  = ((maxX - minX) + pw * 2) / 55;
  const pts = topology.map(p => `${p.x},${-p.y}`).join(' ');

  return (
    <div style={{ padding: '16px 0', display: 'flex', justifyContent: 'center' }}>
      <svg viewBox={vb} style={{ width: '100%', maxWidth: 380, display: 'block', filter: 'drop-shadow(0 0 12px rgba(225,6,0,0.45))' }}>
        {/* Shadow track */}
        <polyline points={pts} fill="none" stroke="rgba(225,6,0,0.15)" strokeWidth={sw * 2.5} strokeLinejoin="round" strokeLinecap="round" />
        {/* Main track */}
        <polyline points={pts} fill="none" stroke="#E10600" strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" />
        {/* Highlight */}
        <polyline points={pts} fill="none" stroke="rgba(255,100,100,0.4)" strokeWidth={sw * 0.4} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function Circuit() {
  const [selected, setSelected] = useState('bahrain');
  const { data: topology, loading: topoLoading, refetch: fetchTopo } = useRaceData(`/api/circuit/${selected}/topology`);
  const { data: history,  loading: histLoading, refetch: fetchHist } = useRaceData(`/api/circuit/${selected}/history`);

  useEffect(() => {
    fetchTopo();
    fetchHist();
  }, [selected]);

  const circuit = ALL_CIRCUITS.find(c => c.id === selected) || ALL_CIRCUITS[0];

  return (
    <PageTransition>
      <title>APEX | Circuit Explorer</title>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.2rem', marginBottom: 4 }}>Circuit Explorer</h1>
        <p style={{ color: '#555', fontSize: '0.8rem' }}>Real telemetry-plotted 2D track maps for every circuit in F1 history.</p>
      </div>

      {/* Circuit picker grid */}
      <div className="panel" style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div className="panel-header" style={{ marginBottom: 12 }}>Select Circuit</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ALL_CIRCUITS.map(({ id, name, flag }) => (
            <button
              key={id}
              onClick={() => setSelected(id)}
              style={{
                fontFamily: 'Titillium Web, sans-serif',
                fontSize: '0.72rem',
                fontWeight: selected === id ? 700 : 400,
                padding: '5px 12px',
                borderRadius: 4,
                border: selected === id ? '1px solid #E10600' : '1px solid #222',
                background: selected === id ? 'rgba(225,6,0,0.12)' : 'rgba(255,255,255,0.02)',
                color: selected === id ? '#fff' : '#666',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              <span style={{ fontSize: '0.85rem' }}>{flag}</span>
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
        {/* Circuit map */}
        <div className="panel" style={{ borderTop: '2px solid #E10600' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div className="panel-header" style={{ marginBottom: 0 }}>
              {circuit.flag} {circuit.name.toUpperCase()} CIRCUIT
            </div>
          </div>
          <CircuitSVG topology={topology} loading={topoLoading} />

          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 16, height: 3, background: '#E10600', borderRadius: 2, boxShadow: '0 0 6px rgba(225,6,0,0.5)' }} />
              <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.5rem', color: '#555' }}>TRACK LAYOUT</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 16, height: 3, background: 'rgba(225,6,0,0.15)', borderRadius: 2 }} />
              <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.5rem', color: '#555' }}>TELEMETRY SOURCE</span>
            </div>
          </div>
        </div>

        {/* Sidebar stats + history */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Circuit info */}
          <div className="panel">
            <div className="panel-header">Circuit Info</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              {[
                { label: 'Country',  value: circuit.country },
                { label: 'Circuit',  value: circuit.name   },
                { label: 'Data Src', value: topology ? `${topology.length} pts` : 'Fetching...' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.55rem', color: '#555', letterSpacing: '0.1em' }}>{label}</span>
                  <span style={{ fontFamily: 'Titillium Web', fontWeight: 700, fontSize: '0.8rem' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Race history */}
          <div className="panel">
            <div className="panel-header">Recent Winners</div>
            {histLoading ? (
              <div className="apex-spinner" style={{ margin: '12px auto' }} />
            ) : (history || []).length === 0 ? (
              <div style={{ color: '#444', fontFamily: 'Titillium Web', fontSize: '0.75rem', padding: '12px 0' }}>
                No history data available.
              </div>
            ) : (
              <table className="apex-table">
                <thead><tr><th>YEAR</th><th>WINNER</th><th>TEAM</th></tr></thead>
                <tbody>
                  {(history || []).slice(0,5).map((h, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.72rem' }}>{h.year}</td>
                      <td style={{ fontWeight: 700, fontSize: '0.8rem' }}>{h.winner}</td>
                      <td style={{ fontSize: '0.72rem', color: '#808080' }}>{h.team}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

// src/pages/Encyclopedia.jsx — Driver Intelligence Cards & Constructors database
import { useState } from 'react';
import PageTransition from '@/components/animations/PageTransition';
import { useRaceData } from '@/hooks/useRaceData';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

// ── Driver Card Component ────────────────────────────────────────────────
function DriverCard({ driver }) {
  const displayCode = driver.code && driver.code !== '\\N' ? driver.code : 
                      (driver.driver_id ? driver.driver_id.substring(0, 3).toUpperCase() : '---');

  return (
    <div className="panel card-hover" style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 140 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.65rem', color: '#E10600', fontWeight: 700, letterSpacing: '0.1em' }}>
          {displayCode}
        </span>
        <span style={{ fontFamily: 'Titillium Web', fontSize: '0.65rem', color: '#444' }}>
          {driver.nationality || 'Unknown'}
        </span>
      </div>
      
      <div style={{ fontFamily: 'Titillium Web, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#e0e0e0', lineHeight: 1.2, marginTop: 'auto' }}>
        {driver.full_name || driver.driver_id || '--'}
      </div>
      <div style={{ fontFamily: 'Orbitron', fontSize: '0.5rem', color: '#555', letterSpacing: '0.1em' }}>
        BORN: {driver.dob || '--'}
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function Encyclopedia() {
  const [tab, setTab] = useState('drivers');
  const [search, setSearch] = useState('');
  
  // Show 60 at a time to keep UI snappy
  const [limit, setLimit] = useState(60);

  const { data: drivers, loading: dLoading } = useRaceData('/api/historical/drivers', { immediate: true });
  const { data: teams,   loading: tLoading } = useRaceData('/api/historical/constructors', { immediate: true });

  const source  = tab === 'drivers' ? (drivers  || []) : (teams || []);
  const loading = tab === 'drivers' ? dLoading : tLoading;

  const filtered = source.filter(item => {
    const q = search.toLowerCase();
    return (
      (item.full_name      || '').toLowerCase().includes(q) ||
      (item.name           || '').toLowerCase().includes(q) ||
      (item.code           || '').toLowerCase().includes(q) ||
      (item.nationality    || '').toLowerCase().includes(q) ||
      (item.constructor_id || '').toLowerCase().includes(q)
    );
  });

  const visibleItems = filtered.slice(0, limit);

  return (
    <PageTransition>
      <title>APEX | Intelligence Cards</title>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.2rem', marginBottom: 4 }}>Intelligence Cards</h1>
        <p style={{ color: '#555', fontSize: '0.8rem' }}>
          Explore the database of F1 history. View hundreds of historical drivers and constructors.
        </p>
      </div>

      {/* Controls */}
      <div className="panel" style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', padding: '14px 20px' }}>
        <div className="seg-control">
          <button className={`seg-btn ${tab === 'drivers' ? 'active' : ''}`} onClick={() => { setTab('drivers'); setSearch(''); setLimit(60); }}>
            DRIVERS
          </button>
          <button className={`seg-btn ${tab === 'teams' ? 'active' : ''}`} onClick={() => { setTab('teams'); setSearch(''); setLimit(60); }}>
            CONSTRUCTORS
          </button>
        </div>

        <input
          type="text"
          placeholder={tab === 'drivers' ? 'Search driver, code or nationality…' : 'Search team name or nationality…'}
          value={search}
          onChange={e => { setSearch(e.target.value); setLimit(60); }}
          className="apex-select"
          style={{ flex: 1, minWidth: 220, maxWidth: 400 }}
        />

        <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.54rem', color: '#555', letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>
          {filtered.length} {tab === 'drivers' ? 'DRIVERS' : 'TEAMS'}
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 16 }}>
          <div className="apex-spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.55rem', color: '#444', letterSpacing: '0.2em' }}>
            ASSEMBLING DOSSIERS...
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.65rem', color: '#444', letterSpacing: '0.15em' }}>
            {search ? `NO DOSSIERS FOR "${search.toUpperCase()}"` : 'NO DATA AVAILABLE'}
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {visibleItems.map((item, i) => (
              tab === 'drivers' ? (
                <DriverCard key={item.driver_id || i} driver={item} />
              ) : (
                <div key={item.constructor_id || i} className="panel card-hover" style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 140 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.52rem', color: '#555', letterSpacing: '0.08em' }}>
                      {item.constructor_id || '---'}
                    </span>
                    <span style={{ fontFamily: 'Titillium Web', fontSize: '0.65rem', color: '#444' }}>
                      {item.nationality || ''}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'Titillium Web, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#e0e0e0', lineHeight: 1.2, marginTop: 'auto' }}>
                    {item.name || item.constructor_id || '--'}
                  </div>
                </div>
              )
            ))}
          </div>

          {filtered.length > limit && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 30, marginBottom: 20 }}>
              <button 
                className="btn btn-ghost" 
                onClick={() => setLimit(prev => prev + 60)}
                style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.6rem', letterSpacing: '0.1em' }}
              >
                LOAD MORE
              </button>
            </div>
          )}
        </>
      )}
    </PageTransition>
  );
}

// src/pages/Encyclopedia.jsx — All-time F1 drivers and constructors database
import { useState } from 'react';
import PageTransition from '@/components/animations/PageTransition';
import { useRaceData } from '@/hooks/useRaceData';

export default function Encyclopedia() {
  const [tab, setTab] = useState('drivers');
  const [search, setSearch] = useState('');

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

  return (
    <PageTransition>
      <title>APEX | F1 Encyclopedia</title>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.2rem', marginBottom: 4 }}>F1 Encyclopedia</h1>
        <p style={{ color: '#555', fontSize: '0.8rem' }}>
          Complete database of every driver and constructor in Formula 1 history.
        </p>
      </div>

      {/* Controls */}
      <div className="panel" style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', padding: '14px 20px' }}>
        <div className="seg-control">
          <button className={`seg-btn ${tab === 'drivers' ? 'active' : ''}`} onClick={() => { setTab('drivers'); setSearch(''); }}>
            DRIVERS
          </button>
          <button className={`seg-btn ${tab === 'teams' ? 'active' : ''}`} onClick={() => { setTab('teams'); setSearch(''); }}>
            CONSTRUCTORS
          </button>
        </div>

        <input
          type="text"
          placeholder={tab === 'drivers' ? 'Search by name, code or nationality…' : 'Search by team name or nationality…'}
          value={search}
          onChange={e => setSearch(e.target.value)}
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
            LOADING DATABASE...
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.65rem', color: '#444', letterSpacing: '0.15em' }}>
            {search ? `NO RESULTS FOR "${search.toUpperCase()}"` : 'NO DATA AVAILABLE'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {filtered.map((item, i) => (
            <div key={i} className="panel card-hover" style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {tab === 'drivers' ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.65rem', color: '#E10600', fontWeight: 700, letterSpacing: '0.1em' }}>
                      {item.code || '---'}
                    </span>
                    <span style={{ fontFamily: 'Titillium Web', fontSize: '0.65rem', color: '#444' }}>
                      {item.nationality || ''}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'Titillium Web, sans-serif', fontWeight: 700, fontSize: '0.88rem', color: '#e0e0e0', lineHeight: 1.2 }}>
                    {item.full_name || item.driver_id || '--'}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.52rem', color: '#555', letterSpacing: '0.08em' }}>
                      {item.constructor_id || '---'}
                    </span>
                    <span style={{ fontFamily: 'Titillium Web', fontSize: '0.65rem', color: '#444' }}>
                      {item.nationality || ''}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'Titillium Web, sans-serif', fontWeight: 700, fontSize: '0.88rem', color: '#e0e0e0', lineHeight: 1.2 }}>
                    {item.name || item.constructor_id || '--'}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
